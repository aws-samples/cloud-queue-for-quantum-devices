import { useEffect, useState } from 'react'
import { Container, Table, Button, Modal, Form, Stack, ToggleButtonGroup, ToggleButton, Pagination, Alert, Badge } from 'react-bootstrap';
import { API } from 'aws-amplify';
import { useParams } from "react-router-dom";

function Workloads({ user }) {
  const [ show, setShow ] = useState(false);
  const [ file, setFile ] = useState(false);
  const [ refreshKey, setRefreshKey ] = useState(0);
  const [ workloads, setWorkloads ] = useState({ Items: [] });
  const { DeviceId } = useParams();
  const [ filterSort, setFilterSort ] = useState({ AccountId: user.username, PageList: [] });
  const [ error, setError ] = useState(false);
  const [ deviceInfo, setDeviceInfo ] = useState(false);
  
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  
  async function downloadConfiguration(DeviceId) {
    try {
      const deviceInfo = await API.get('API', `/devices/${DeviceId}`);
    
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.download = "test";
      a.href = deviceInfo.DeviceConfigurationUrl;
      a.click();
      a.remove();
      
    }
    catch (e) {
      console.error(e);
    }
  }
  
  async function downloadResults(WorkId) {
    try {
      const work = await API.get('API', `/workloads/${WorkId}`);
    
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.download = "test";
      a.href = work.WorkloadResultUrl;
      a.click();
      a.remove();
      
    }
    catch (e) {
      console.error(e);
    }
  }
  
  useEffect(() => {
    async function fetchDevice() {
      try {
        const deviceInfo = await API.get('API', `/devices/${DeviceId}`);

        setDeviceInfo(deviceInfo);
      }
      catch (e) {
        console.error(e);
        setError("There was a problem retrieving data. Please confirm permissions.");
      }
    }
  
    fetchDevice();
  }, [DeviceId, refreshKey]);
  
  useEffect(() => {
    async function fetchWorkloads() {
      try {
        const workListData = await API.get('API', "/workloads", {
          'queryStringParameters': {
            'DeviceId': DeviceId,
            'AccountId': filterSort.AccountId,
            'ExclusiveStartKeyJson': JSON.stringify(filterSort.PageList[filterSort.PageList.length - 1])
          }
        });

        setWorkloads(workListData);
      }
      catch (e) {
        console.error(e);
        setError("There was a problem retrieving data. Please confirm permissions.");
      }
    }
  
    fetchWorkloads();
  }, [DeviceId, refreshKey, filterSort]);

  const handleFile = (e) => {
    setFile(e.target.files[0]);
  }
  
  const submitForm = async (e) => {
    e.preventDefault()
    
    try {
      const myInit = {
        body: {
          DeviceId,
          Priority: e.target.formPriority.value
        }
      };
      
      const workListData = await API.post('API', "/workloads", myInit);

      const params = { 
        method: "PUT", 
        headers: {"Content-Type": "application/octet-stream"}, 
        body: file
      };
      
      fetch(workListData.UploadUrl, params);
      
      setRefreshKey(oldKey => oldKey +1);
    }
    catch (e) {
      console.error(e);
    }
    
    handleClose();
  }
  
  const handleAccountFilter = (e) => {
    setFilterSort({
      PageList: [],
      AccountId: e.currentTarget.value
    })
  }
  const handleNext = (e) => {
    setFilterSort(currentFilterSort => ({
      ...currentFilterSort,
      PageList: [...currentFilterSort.PageList, workloads.LastEvaluatedKey]
    }));
  }
  
  const handlePrev = (e) => {
    setFilterSort(currentFilterSort => ({
      ...currentFilterSort,
      PageList: currentFilterSort.PageList.slice(0, -1)
    }));
  }
  
  function DeviceStatus({ status }) {
    switch(status) {
      case "OFFLINE":
          return <Badge bg="danger">OFFLINE</Badge>
      case "ONLINE":
          return <Badge bg="success">ONLINE</Badge>
      case "BUSY":
          return <Badge bg="warning" text="dark">BUSY</Badge>
      default:
          <Badge bg="secondary">{status}</Badge>
    }
  }
  
  function DeviceInfo({ deviceInfo }) {
    return (
      <Container>
        <b>{deviceInfo.DeviceName}{' '}<DeviceStatus status={deviceInfo.DeviceStatus} /></b><br />
        <small><i>{deviceInfo.DeviceId}</i></small>
      </Container>
    )
  }
  
  if (error) {
    return (
      <Container>
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    )
  }
  
  return (
    <Container>
      <Container>
        <DeviceInfo deviceInfo={deviceInfo} /> 
        <Stack direction="horizontal" gap={2}>
          <Button onClick={() => setRefreshKey(oldKey => oldKey +1)} className="ms-auto" variant="secondary">Refresh</Button>
          <Button disabled={!deviceInfo.DeviceConfigurationUrl} onClick={() => downloadConfiguration(DeviceId)}>Download Configuration</Button>
          <ToggleButtonGroup type="radio" name="AccountId" defaultValue={user.username}>
            <ToggleButton type="radio" variant="outline-primary" id="tbg-radio-1" value={user.username} onChange={handleAccountFilter}>
              Mine
            </ToggleButton>
            <ToggleButton type="radio" variant="outline-primary" id="tbg-radio-2" value={''} onChange={handleAccountFilter}>
              All
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <br/>
        
        <Pagination>
          <Pagination.Prev onClick={handlePrev} disabled={filterSort.PageList.length === 0}/>
          <Pagination.Next onClick={handleNext} disabled={!workloads.LastEvaluatedKey}/>
        </Pagination>
        
        <Table striped bordered hover>
        <thead>
          <tr>
            <th>Work ID</th>
            <th>Created At</th>
            <th>Created By</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Results</th>
          </tr>
        </thead>
        <tbody>
        {workloads.Items.map(( workload ) => {
          return (
            <tr key={workload.WorkId}>
              <td>{workload.WorkId}</td>
              <td>{workload.CreatedAt}</td>
              <td>{workload.UserGivenName}</td>
              <td>{workload.Priority}</td>
              <td>{workload.WorkStatus}</td>
              <td>
                {["DONE", "ERROR"].includes(workload.WorkStatus) && 
                <Button className="ms-auto" variant="primary" onClick={() => downloadResults(workload.WorkId)}>Download</Button>
                }
              </td>
            </tr>
          );
        })}
        </tbody>
      </Table>
      
      <Stack direction="horizontal" gap={2}>
        <Button onClick={handleShow} variant="primary">Add workload</Button>
      </Stack>
        
      <Modal show={show} onHide={handleClose}>
        <Form onSubmit={submitForm}>
          <Modal.Header closeButton>
            <Modal.Title>Add workload</Modal.Title>
          </Modal.Header>
          
          <Modal.Body>
            
            <Form.Group className="mb-3" controlId="formPriority">
              <Form.Label>Priority</Form.Label>
              <Form.Select aria-label="Default select example">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Workload file</Form.Label>
              <Form.Control type="file" onChange={handleFile} />
            </Form.Group>
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      </Container>
    </Container>
  );
}

export default Workloads;

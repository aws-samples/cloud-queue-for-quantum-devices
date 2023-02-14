import { useEffect, useState } from 'react'
import { Table, Container, Alert } from 'react-bootstrap';
import { API } from 'aws-amplify';
import { Link } from "react-router-dom";

function Devices() {
  const [devices, setDevices] = useState([]);
  const [ error, setError ] = useState(false);
    
  async function fetchDevices() {
    try {
      const workListData = await API.get('API', "/devices");
      setDevices(workListData)
      setError(false);
    }
    catch (e) {
      console.error(e);
      setError("There was a problem retrieving data. Please confirm permissions.");
    }
  }
  
  useEffect(() => {
    fetchDevices();
  }, []);
  
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
        <Table striped bordered hover>
        <thead>
          <tr>
            <th>Device Name</th>
            <th>Device Status</th>
          </tr>
        </thead>
        <tbody>
        {devices.map(( device ) => {
          return (
            <tr key={device.DeviceId}>
              <td><Link to={`/devices/${device.DeviceId}/workloads`}>{device.DeviceName}</Link></td>
              <td>{device.DeviceStatus}</td>
            </tr>
          );
        })}
        </tbody>
        </Table>
    </Container>
  );
}

export default Devices;

# AWS Cloud Queue for Quantum Devices

## Let's Get Started!

## Prerequisites
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html): `aws --version` (2.x)
- [Node.js](https://nodejs.org/en/download/): `node --version` (16.x)
- [jq](https://stedolan.github.io/jq/): jq --version

## Setup

1. Login or [Create](https://portal.aws.amazon.com/billing/signup?type=enterprise#/start) an AWS Account.
2. In a terminal, clone this repo and change into the directory.
3. Install the [Amplify CLI](https://github.com/aws-amplify/amplify-cli) and application dependencies.
```
npm install -g @aws-amplify/cli
npm install
```
3. If it’s your first time using the CLI, you will need to configure it by running `amplify configure`. Follow the instructions to create an IAM profile locally.
4. Now let’s initialize an Amplify project in this directory. `amplify init`

```
$ amplify init
? Enter a name for the environment  dev
? Choose your default editor: (pick an editor)
? Do you want to use an AWS profile? Y (this should be the profile you created in step #4)
```

5. To deploy the application (include the UI) to the cloud, run `amplify push`, then `amplify publish`.
6. Now, you will create an Admin user to access the UI and the APIs. Run the following commands:
```
export COGNITO_USER_POOL_ID=$(jq -r '.auth[(.auth | keys)[0]].output.UserPoolId' ./amplify/#current-cloud-backend/amplify-meta.json)

aws cognito-idp admin-create-user --user-pool-id $COGNITO_USER_POOL_ID --username <username> --user-attributes Name="email",Value="<username>" Name="given_name",Value="<fullname>"

aws cognito-idp admin-add-user-to-group --user-pool-id $COGNITO_USER_POOL_ID --username <username> --group-name Admin

```

7. Now sign into the UI! You can retrieve the URL by running the following command:
```
amplify hosting status
```

## Calling the API
TODO

## Running the UI locally

1. `npm run start`
2. The app should run on http://localhost:3000/.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

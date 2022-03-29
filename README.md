# Test Requirements

1. Create a `upgradable`, `pausable` __tokenavgprice__ smart contract which can be used to calculate the average price of a token (with given address).

> NOTE: 
> 1. You can't use any loops for adding prices like `for`, `while`, etc.
> 2. You have full freedom to decide the data structure of the contract for efficient gas consumption.
> 3. Follow GMT timestamp as day timezone for precision.

2. Implement the "Diamond standard" instead of traditional proxy pattern based upgradeability methods. 

## Features
* Set price for a day.
* View price on a day.
* View average token price from _Aug_ to _Sept_ out of 1 year data (_Jan_-_Dec_).

## Deployment
Before every iteration, the code has to updated & deployed by the 1st owner only in the same address with no change in the storage variables.

> 1st owner is the account which is used to deploy the `version-1`.

### Version-1
* Anyone can set everyday price of a token. 

### Version-2
* Only Owner can set everyday price of a token.

### Version-3
* The price of a token on a day can be set on the same day itself.


## Unit Testing
* Write as many possible unit tests for all three version using typescript language with Hardhat

## Dependencies
* Openzeppelin
* Diamond standard
* Slither for finding SC vulnerabilities

## Testing framework
* Hardhat using Typescript language.
* Include console based log inside the contract so that it is helpful for debugging.

## Networks
* localhost
* Rinkeby

## Examine
* Whether diamond standard is followed.
* Efficient code in terms of gas consumption
* Secure code: shouldn't have defi hack bugs in the contract code.
* Production code i.e use variable names by format which is used in the production codebase.
* Use solidity [NATSPEC](https://docs.soliditylang.org/en/latest/style-guide.html#natspec) 


-------------------------------------------------------------------------------------------------------

# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).

# ERC20 DEX

This repository hosts the contents of my TFG

# What is a TFG

The Degree Final Project (TFG in Spanish) consists of the student undertaking an autonomous project under the direction of a tutor, the completion of which is intended to help the students implement the skills that they have gained during their studies and ensure that they acquire the relevant competences associated with their degree.

Each degree has a Final Project Committee that aims, in part, to prepare the necessary guidelines for the organisation and development of this area.

# Aim of this Project

The main purpose of this project is to develop a Descentralized Exchange (DEX) using the Ethereum platform.
This DEX will allow users to exchange ERC20 tokens and ETH in a descentralized manner.
Users will be able to publish offers to either buy or sell ERC20/ETH and will also be able to fill said offers.

# Workflow of the DEX

1. User deposits tokens into the DEX contract.
2. User can now either fill or publish buy/sell orders.
3. Once the user either fills an order or gets its order filled, the contract will manage the deposited funds
  for the users involded in the transaction and make the neccesary calls to fulfill said order.
4. Once the order has been fulfilled, users can decide to withdraw the tokens or keep on exchanging.

# Running this project
  Currently this project can only be executed in local.
  
  1. Setup Ganache at 127.0.0.1:7545
  2. Deploy the contracts by executing truffle migrate
  3. got to https://github.com/Jaime-Iglesias/exchange-frontend and exceute: npm start on the client folder.
  
# Technology

  React
  Web3
  Metamask
  Truffle
    

# Table of Content

* [Introduction](README.md#introduction)
* [User Guide]( README.md#user-guide)
  * [Installing dependencies](README.md#dependencies)
  * [Installing](README.md#installing)
  * [Running the app](README.md#running-the-app)
* [Configuration](README.md#configuration)

# Introduction

on-web-ui is a web utility provided to help user to try out RackHD APIs in a handy graphic interface. We developed Gen1 of on-web-ui since 2015. In order to purse better user experience, we rewrote whole on-web-ui code with new designed UI to evolve this project to Gen2 on 2018. A big update to Angular 8 is developed in Gen3 on 2020.

* on-web-ui Gen1 (version below v2.33.0)
  - Based on React
  - All source codes are kept in repo branch "on-web-ui_1.0" and could be accessed at https://github.com/RackHD/on-web-ui/tree/on-web-ui_1.0

* on-web-ui Gen2 (version above v3.0.0)
  - Based on Angular5 + Clarify v0.13
  - All source codes are kept in master branch. 

* on-web-ui Gen3 (version above v4.0.0)
  - Based on Angular8 + Clarify v2
  - All source codes are kept in master branch. 
  - This README file only contains information about on-web-ui Gen3.

# User Guide
## Dependencies
What you need to run this app:
* `node` and `npm` (`brew install node`)
* Ensure you're running the latest versions Node `v8.x.x` and NPM `5.x.x`+

> If you have `nvm` installed, which is highly recommended (`brew install nvm`) you can do a `nvm install --lts && nvm use` in `$` to run with the latest Node LTS. You can also have this `zsh` done for you [automatically](https://github.com/creationix/nvm#calling-nvm-use-automatically-in-a-directory-with-a-nvmrc-file)

## Installing
* `fork` this repo
* `clone` your fork
* `npm install` to install all dependencies or `yarn`

## Running the app
After you have installed all dependencies you can now run the app. Run `npm run server` to start a local server using `webpack-dev-server` which will watch, build (in-memory), and reload for you. The port will be displayed to you as `http://0.0.0.0:4200`.

### server
```bash
# development
npm start

# production
npm run build
```
## Other commands

```bash
# test
npm test

# docker
npm run start-docker
```

# Configuration
Configuration files live in `config/` we are currently using webpack, karma, and protractor for different stages of your application

# Copyright
Copyright 2017, Dell EMC

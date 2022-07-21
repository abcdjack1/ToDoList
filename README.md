# ToDoList

## Environmental preparation

* MongoDB:  
You can run following command in docker.  
`docker run --name db -d -p 27017:27017 mongo`  
more details via [Mongo - Official Image](https://hub.docker.com/_/mongo)

* NodeJS:  
Download [Node.JS](https://nodejs.org/en/) and install [ng](https://www.npmjs.com/package/@angular/cli)

## Install dependencis

Run `cd frontend` & `npm i`  
Run `cd backend` & `npm i`  

## Running unit tests

Run `cd frontend` & `npm run test`  
Run `cd backend` & `npm run test`

## Start Server

Run `cd frontend` & `npm run build`  
Run `cd backend` & `npm start`  
Navigate to `http://localhost:8081/`

# Dynalist API Client

This is a work in progress. The idea is to build a wrapper around the dynalist api that makes it easy to complete common tasks and to have a recursive data structure to work with while manipulating the data (instead of the default flat file structure given by the dynalist api).
The dynalist api reference can be found [here](https://apidocs.dynalist.io/#general).
The typescript types are mostly non-existant at the moment but this is being worked on.

## To install this package:
### NPM:
`npm install dynalist-api`

### Yarn:
`yarn add dynalist-api`

## To use the API Client:

```
const {DynalistApi} = require('dynalist-api');
api = new DynalistApi('<dynalist api developer token>');
```
or
```
import {DynalistApi} from 'dynalist-api';
api = new DynalistApi('<dynalist api developer token>');
```
Note: A timeout in ms can be passed in as the second parameter. By default this is one second (1000ms) to avoid the dynalist api being hammered by multiple requests. If you will not call the api many times it's recommened to pass a 0 in as the second parameter when creating this class.
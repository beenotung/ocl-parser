import * as fs from "fs";
import {Token, tokenize} from "../src/tokenizer";
import {Observable} from "rxjs/Observable";

function logResult(o: Observable<Token>) {
    const tokens = [];
    o.subscribe(
        x => {
            console.log('token:', x);
            tokens.push(x);
        }
        , e => console.error('error:', e)
        , () => console.log('done:', tokens)
    )
}

function testFile() {
    fs.readFile('./res/example.ocl', (err, data) => {
        if (err) {
            throw err;
        }
        logResult(tokenize(data.toString()))
    });
}

function testNumber() {
    logResult(tokenize('123 321'))
}

// testNumber();
testFile();
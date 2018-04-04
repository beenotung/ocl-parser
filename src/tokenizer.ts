import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {partitionArrayBy} from "@beenotung/tslib/array";

export interface Token {
    keyword?: string
    number?: number
    comment?: string
    name?: string
}

const isBetween = (l, m, r) => l <= m && m <= r;
const isDigit = c => isBetween('0', c, '9');
const isLowerCase = c => isBetween('a', c, 'z');
const isUpperCase = c => isBetween('A', c, 'Z');
const isAlphabet = c => isLowerCase(c) || isUpperCase(c);
const isWhiteSpace = c => c == ' ' || c == '\t';
const isLineBreak = c => c == '\n' || c == '\r';

const keyword_str = 'if then else endif context inv : :: < > <= >= = <> pre post -> forAll select iterate exists ( ) . # |'
    + ' @pre ; + - * /'
;
const keywords = keyword_str.split(' ')
    .sort()
    .reverse()
;
const [alphabetKeywords, symbolKeywords] = partitionArrayBy(keywords, s => isAlphabet(s[s.length - 1]));

export function tokenize(s: string, offset: number = 0): Observable<Token> {
    console.log(`tokenize(s, ${offset})`);
    const subject = new Subject<Token>();
    const next = () => {
        console.log(`next(s, ${offset})`);
        if (offset >= s.length) {
            return subject.complete();
        }
        let c = s[offset];

        /* check number */
        if (isDigit(c)) {
            let acc = c.charCodeAt(0) - 48;
            offset++;
            for (; ;) {
                c = s[offset];
                if (isDigit(c)) {
                    acc = acc * 10 + c.charCodeAt(0) - 48;
                    offset++;
                    continue;
                }
                break;
            }
            subject.next({number: acc});
            return setTimeout(next);
        }

        /* check whitespace */
        if (isWhiteSpace(c) || isLineBreak(c)) {
            offset++;
            for (; ;) {
                c = s[offset];
                if (isWhiteSpace(c) || isLineBreak(c)) {
                    offset++;
                    continue;
                }
                break;
            }
            return next();
        }

        /* check comment */
        if (c == '-' && s[offset + 1] == '-') {
            offset += 2;
            let end = s.indexOf('\r', offset);
            if (end == -1) {
                end = s.indexOf('\n', offset);
                if (end == -1) {
                    end = s.length;
                }
            }
            console.log(`comment from ${offset} to ${end}`);
            const comment = s.substring(offset, end);
            subject.next({comment});
            offset = end;
            return setTimeout(next);
        }

        /* check keyword */
        for (const x of keywords) {
            // console.log(`test keyword: \`${x}\``);
            if (s.startsWith(x, offset)) {
                if (alphabetKeywords.indexOf(x) != -1) {
                    /* alphabet keyword */
                    let c = s[offset + x.length];
                    if (c >= s.length || !isAlphabet(c)) {
                        offset += x.length;
                        subject.next({keyword: x});
                        return setTimeout(next);
                    }
                } else {
                    /* symbol keyword */
                    // let c = s[offset + x.length];
                    // console.log(`match symbol keyword: \`${x}\`, next is \`${c}\``);
                    // if (c >= s.length || isAlphabet(c) || isWhiteSpace(c) || isLineBreak(c)) {
                        offset += x.length;
                        subject.next({keyword: x});
                        return setTimeout(next);
                    // }
                }
            }
        }

        /* check name */
        if (isAlphabet(c)) {
            const start = offset;
            offset++;
            for (; ;) {
                c = s[offset];
                if (isDigit(c) || isAlphabet(c)) {
                    offset++;
                    continue;
                }
                break;
            }
            const name = s.substring(start, offset);
            subject.next({name});
            return setTimeout(next);
        }

        /* unknown pattern */
        console.error('unexpected token:', {c, offset});
        subject.error(`unexpected token: \`${c}\``)
    };
    setTimeout(next);
    return subject.asObservable();
}
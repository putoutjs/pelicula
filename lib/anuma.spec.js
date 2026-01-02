import {test} from 'supertape';
import montag from 'montag';
import {lint} from './anuma.js';

test('anuma: lint', (t) => {
    const source = `
        console.log('x');
        debugger;
        console.log('y');
    `;
    
    const [, places] = lint(source, {
        fix: false,
        rules: {
            'remove-debugger': 'on',
        },
        plugins: ['remove-debugger'],
    });
    
    const expected = [{
        message: `Unexpected 'debugger' statement`,
        position: {
            column: 8,
            line: 3,
        },
        rule: 'remove-debugger (ast-grep)',
    }];
    
    t.deepEqual(places, expected);
    t.end();
});

test('anuma: lint: fix', (t) => {
    const source = montag`
        console.log('x');
        debugger;
        console.log('y');
    `;
    
    const [code] = lint(source, {
        rules: {
            'remove-debugger': 'on',
        },
        plugins: ['remove-debugger'],
    });
    
    const expected = montag`
        console.log('x');
        
        console.log('y');
    `;
    
    t.equal(code, expected);
    t.end();
});

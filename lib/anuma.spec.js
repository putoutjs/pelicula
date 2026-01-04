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

test.skip('anuma: lint: template values', (t) => {
    const source = montag`
        t.ok(result.includes('hello'));
    `;
    
    const [code] = lint(source, {
        rules: {
            'tape': 'off',
            'tape/convert-ok-to-match': 'on',
        },
        plugins: ['tape'],
    });
    
    const expected = montag`
         t.match(result, 'hello');
    `;
    
    t.equal(code, expected);
    t.end();
});

test.skip('anuma: lint: template values: exclude', (t) => {
    const source = montag`
        t.ok(keys(result).includes('hello'));
    `;
    
    const [code] = lint(source, {
        rules: {
            'tape': 'off',
            'tape/convert-ok-to-match': 'on',
        },
        plugins: ['tape'],
    });
    
    const expected = montag`
         t.match(result, 'hello');
    `;
    
    t.equal(code, expected);
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

test('anuma: lint: __args', (t) => {
    const source = montag`
        if (hello?.world) {
            hello.world(1, 2);
        }
    `;
    
    const [code] = lint(source, {
        plugins: ['conditions'],
    });
    
    const expected = montag`
        hello?.world(1, 2)
    `;
    
    t.equal(code, expected);
    t.end();
});

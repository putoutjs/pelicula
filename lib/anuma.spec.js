import {test} from 'supertape';
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

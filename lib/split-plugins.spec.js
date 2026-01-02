import {loadPlugins} from '@putout/engine-loader';
import {test} from 'supertape';
import {declare} from '@putout/plugin-declare';
import {splitPlugins} from './split-plugins.js';

test('anuma: splitPlugins', (t) => {
    const plugins = loadPlugins({
        rules: {
            'declare': 'on',
            'remove-debugger': 'on',
        },
        pluginNames: [
            'declare',
            'remove-debugger',
        ],
    });
    
    const result = splitPlugins(plugins);
    const expected = [
        [{
            message: `Unexpected 'debugger' statement`,
            patterns: [
                ['debugger', ''],
            ],
            rule: 'remove-debugger',
        }],
        [{
            msg: '',
            options: {},
            plugin: {
                declare,
            },
            rule: 'declare',
        }],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('anuma: splitPlugins: report with args', (t) => {
    const plugins = loadPlugins({
        rules: {
            'tape': 'off',
            'tape/convert-ok-to-match': 'on',
            'remove-debugger': 'on',
        },
        pluginNames: ['tape', 'remove-debugger'],
    });
    
    const [result] = splitPlugins(plugins);
    const expected = [{
        message: `Use 't.match()' instead of 't.ok()'`,
        patterns: [
            ['t.ok($A.includes($B))', 't.match($A, $B)'],
            ['t.ok($A.includes($B), $C)', 't.match($A, $B, $C)'],
            ['t.ok($A.test($B))', 't.match($B, $A)'],
            ['t.ok($A.test($B), $C)', 't.match($B, $A, $C)'],
        ],
        rule: 'tape/convert-ok-to-match',
    }, {
        message: `Unexpected 'debugger' statement`,
        patterns: [
            ['debugger', ''],
        ],
        rule: 'remove-debugger',
    }];
    
    t.deepEqual(result, expected);
    t.end();
});

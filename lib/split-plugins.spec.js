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
            ['t.ok(__a.includes(__b))', 't.match(__a, __b)'],
            ['t.ok(__a.includes(__b), __c)', 't.match(__a, __b, __c)'],
            ['t.ok(__a.test(__b))', 't.match(__b, __a)'],
            ['t.ok(__a.test(__b), __c)', 't.match(__b, __a, __c)'],
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

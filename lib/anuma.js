import {parse, Lang} from '@ast-grep/napi';
import {loadPlugins} from '@putout/engine-loader';
import {splitPlugins} from './split-plugins.js';

export function lint(source, overrides = {}) {
    const {
        rules,
        plugins,
        fix = true,
    } = overrides;
    
    const cargoPlugins = loadPlugins({
        rules,
        pluginNames: plugins,
    });
    
    const [fastPlugins, restPlugins] = splitPlugins(cargoPlugins);
    const ast = parse(Lang.JavaScript, source);
    
    const root = ast.root();
    const places = [];
    
    for (const {rule, message, patterns} of fastPlugins) {
        for (const [from, to] of patterns) {
            let nodes = root.findAll(`${from};\n`);
            
            if (!nodes.length)
                nodes = root.findAll(`${from};\n`);
            
            for (const node of nodes) {
                if (fix) {
                    const edit = node.replace(to);
                    
                    source = root.commitEdits([edit]);
                    continue;
                }
                
                places.push(getPlace({
                    node,
                    rule: `${rule} (ast-grep)`,
                    message,
                }));
            }
        }
    }
    
    return [
        source,
        places,
        restPlugins,
    ];
}

function getPlace({rule, message, node}) {
    const position = getPosition(node);
    
    return {
        message,
        rule,
        position,
    };
}

function getPosition(node) {
    const {start} = node.range();
    
    const line = start.line + 1;
    const {column} = start;
    
    return {
        line,
        column,
    };
}

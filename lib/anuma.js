import {parse, Lang} from '@ast-grep/napi';
import {loadPlugins} from '@putout/engine-loader';

const isFn = (a) => typeof a === 'function';
const {keys, entries} = Object;

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
                    const edit = node.replace(String(to));
                    
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

function splitPlugins(plugins) {
    const fastPlugins = [];
    const restPlugins = [];
    
    for (const current of plugins) {
        const {rule, plugin} = current;
        const names = keys(plugin);
        
        if (names.includes('match')) {
            restPlugins.push(current);
            continue;
        }
        
        if (!names.includes('replace')) {
            restPlugins.push(current);
            continue;
        }
        
        const [is, fastPlugin] = parsePatterns(rule, plugin);
        
        if (!is) {
            restPlugins.push(current);
            continue;
        }
        
        fastPlugins.push(fastPlugin);
    }
    
    return [fastPlugins, restPlugins];
}

function parsePatterns(rule, plugin) {
    if (plugin.report.length)
        return false;
    
    const result = {
        rule,
        message: plugin.report(),
        patterns: [],
    };
    
    const items = plugin.replace();
    
    for (const [from, to] of entries(items)) {
        if (isFn(to))
            return [false];
        
        result.patterns.push([from, to]);
    }
    
    return [true, result];
}

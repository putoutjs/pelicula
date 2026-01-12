import process from 'node:process';
import {parse, Lang} from '@ast-grep/napi';
import {loadPlugins} from '@putout/engine-loader';
import {tryCatch} from 'try-catch';
import {splitPlugins} from './split-plugins.js';
import {applyFix} from './fix.js';

const maybeSemi = (a) => {
    if (a.endsWith('}'))
        return a;
    
    return `${a};`;
};

function logError() {
    if (process.env.ANUMA_SHOW_ERRORS) {}
}

export function lint(source, overrides = {}) {
    const {
        rules,
        plugins,
        fix = true,
        log = logError,
    } = overrides;
    
    const cargoPlugins = loadPlugins({
        rules,
        pluginNames: plugins,
    });
    
    const [fastPlugins, restPlugins, mapOfPlugins] = splitPlugins(cargoPlugins);
    const ast = parse(Lang.JavaScript, source);
    
    const root = ast.root();
    const places = [];
    
    for (const plugin of fastPlugins) {
        const [error, result] = tryCatch(runPlugin, source, {
            root,
            fix,
            plugin,
        });
        
        if (error) {
            log(error);
            
            const originalPlugin = mapOfPlugins.get(plugin);
            restPlugins.push(originalPlugin);
            continue;
        }
        
        ({source} = result);
        places.push(...result.places);
    }
    
    return [
        source,
        places,
        restPlugins,
    ];
}

function runPlugin(source, {fix, root, plugin}) {
    const {
        rule,
        message,
        patterns,
        exclude = [],
    } = plugin;
    
    const excluded = new Set();
    
    for (const from of exclude) {
        const nodes = root.findAll(maybeSemi(from));
        
        for (const node of nodes) {
            excluded.add(node
                .range()
                .start.index);
        }
    }
    
    const places = [];
    
    for (const [from, to] of patterns) {
        const nodes = root.findAll(maybeSemi(from));
        
        for (const node of nodes) {
            const {index} = node.range().start;
            
            if (excluded.has(index))
                continue;
            
            if (fix) {
                const result = applyFix({
                    node,
                    from,
                    to,
                });
                
                const edit = node.replace(result);
                
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
    
    return {
        source,
        places,
    };
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

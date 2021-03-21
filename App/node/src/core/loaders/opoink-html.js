/*!
* Copyright 2021 Opoink Framework (http://opoink.com/)
* Licensed under MIT, see LICENSE.md
*/
const path = require('path');
const injection = require('./../../var/components.injection');
const jsdom = require('jsdom');
const $ = require('jquery')(new jsdom.JSDOM().window);
const loaderUtils = require('loader-utils');
const ComponentAttrId = require('./../lib/component.attr.id');

const componentAttrId = new ComponentAttrId();

const ROOT = path.dirname(path.dirname(path.dirname(path.dirname(__dirname))));
const DS = path.sep;

var types = {
    before: 'before',
    after: 'after',
    append: 'append',
    prepend: 'prepend'
}

/**
 * inititalize the injection of the template 
 * in DomDocument
 */
function inject(el, name, resourcePath, addFileLocation){
    let newDom = $(el);
    if(!addFileLocation){
        newDom.attr("file_location", resourcePath);
    }
    addAttr(newDom)
    injection.forEach(com => {
        if(typeof com.inject_to != 'undefined'){
            com.inject_to.forEach(component => {
                // let ComName = component.component_name.toLowerCase();
                let ComName = component.component_name;

                if(ComName == name){
                    let eltag = '<'+com.component_name+'></'+com.component_name+'>';
                    let type  = 'append';
                    if(typeof component.inject_type != 'undefined'){
                        type  = component.inject_type;
                    }
                    if(typeof component.wrapper != 'undefined'){
                        eltag  = '<'+component.wrapper+'>' + eltag + '</'+component.wrapper+'>';
                    }

                    if(typeof component.element_id != 'undefined'){
                        /** 
                         * there element id is set here 
                         * so we will look for that element then make an injection
                         * inject to the bottom if not found
                         */
                        let eid = component.element_id;
                        let target = newDom.find('#'+eid);

                        if(target.length){
                            injectElement(target, type, eltag);
                        } else {
                            /** 
                             * we will inject into the component 
                             * either append or prepend only
                             */
                            injectElement(newDom, type, eltag);
                        }
                    } else {
                        /** 
                         * we will inject into the component 
                         * either append or prepend only
                         */
                        injectElement(newDom, type, eltag);
                    }
                }
            });
        }
    });
    return newDom[0].outerHTML;
}

/**
 * inject the element into designated area
 */
 function injectElement(el, type, eltag){
    if(type == types.before){
        $( el ).before( eltag );
    } else if (type == types.after){
        $( el ).after( eltag );
    } else if (type == types.prepend){
        el.prepend(eltag);
    } else {
        el.append(eltag);
    }
}


let componentAttr = 'opoink_vue_component_';
function getHashDir(content){
    let cai = componentAttrId.getComponentAttrId(content);
    componentAttr = cai.component_attr;
}

function addAttr(el){
    el.attr(componentAttr, "");
    let children = el.children();
    if(children.length){
        $.each(children, (key, val) => {
            addAttr($(val));
        })
    }
    return el[0].outerHTML;
}

async function parseElem(source, params){
    const {resourcePath} = params;
    const options = loaderUtils.getOptions(this);

    let addFileLocation = false;
    if(typeof options.addFileLocation != "undefined"){
        addFileLocation = options.addFileLocation
    }

    let dirname = path.dirname(resourcePath);
    let extension = path.extname(resourcePath);
    let file = path.basename(resourcePath, extension);

    getHashDir(dirname);

    let splitSourcePath = resourcePath.split(DS+'App'+DS+'Ext'+DS);
    if(splitSourcePath.length > 1){
        src = inject(source, file, resourcePath, addFileLocation);
        return src;
    } else {
        return source;
    }
}

module.exports = function(source) {
    return parseElem(source, this);
}

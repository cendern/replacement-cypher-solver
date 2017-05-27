(function(){
    var cs = {};

    //propRE: A regular expression defining the possible ciphertext 
    //    characters
    //
    //valRE: A regular expression defining the possible translated
    //    characters.
    //
    //allowDupeMapping: Solve for a replacement scheme that allows 
    //    multiple cipher characters to correspond to the same
    //    translated character.

    var initObj = {
        propRE: new RegExp('^[a-z]$'),
        valRE: new RegExp('^[a-z]$'),
        allowDupeMapping:false
    }

    var TranslationTable = function (existingTT) {
        //copy existing translation values and assume they're good
        if (existingTT instanceof TranslationTable) {
            for (prop in Object.keys(existingTT)) {
                Object.defineProperty(this, prop, {
                    __proto__: null, // no inherited properties
                    enumerable: true,
                    writable: false,
                    value: existingTT[prop]
                });
            }
        } else {
            if (typeof(existingTT) !== 'undefined') throw new this.BadObjectLiteralException('Constructor only accepts a TranslationTable. If you don\'t have one yet, make a new TranslationTable and use addTranslations');
        }
    };

    //define methods
    TranslationTable.prototype = {
        getStuff: function () {
            return "stuff";
        }
    }

    TranslationTable.prototype = Object.create(TranslationTable.prototype, {
        BadObjectLiteralException: {
            value: (function(){
                var BadObjectLiteralException = function(message) {
                    //Debugger is complaining that it's not a constructor.
                    this.message = message;
                    this.name = "BadObjectLiteralException";
                }
                BadObjectLiteralException.prototype.constructor = BadObjectLiteralException;
                return BadObjectLiteralException;
            }())
        },
        propRE: {
            //change this if we need to accommodate 
            value: initObj.propRE
        },
        valRE: {
            value: initObj.valRE
        },
        addTranslations: {
            value: (function(){
                var addProp = function (prop, val) {
                    //If it's a translation and 
                    if (this.hasOwnProperty(prop)) {
                        throw new this.BadObjectLiteralException('Property \'' + prop + '\' is already defined');
                    } else {
                        if (prop.search(this.propRE)) {
                            if (val.search(this.valRE)) {
                                if (!initObj.allowDupeMapping) {
                                    //If duplicate mapping is off then 
                                    // there should be a 1:1 correspondence
                                    // between cipher chars and translated
                                    // characters so it would be an error
                                    // to allow a duplicate mapping
                                    var stuff = this.find(function (el) { return this.el === val });
                                    if (typeof (stuff) !== 'undefined') {
                                        throw new this.BadObjectLiteralException('allowDupeMapping is false, and the translated character \'' + val + '\' already corresponds to \'' + stuff + '\' and you attempted to also set that value for property \'' + prop + '\'');
                                    }
                                }
                                //passed all the checks so far...

                            } else throw new this.BadObjectLiteralException('Property \'' + prop + '\' has value \'' + val + '\' which is required to match the regular expression ' + this.valRE + ' but does not');
                        } else throw new this.BadObjectLiteralException('Property \'' + prop + '\' is required to match regular expression \'' + this.propRE + '\' but does not');
                    }
                }
                return function (translationsObjectLiteral) {
                    if (translationsObjectLiteral instanceof Object) {
                        for (var prop in translationsObjectLiteral)
                            addProp(prop,translationsObjectLiteral[prop]);
                    }
                    //yay chaining!
                    return this;
                }
            }())
        },
        addTranslation: {
            value: function (prop, val) {
                var obj = {};
                obj[prop] = val;
                this.addTranslations(obj);
            }
        }
    });

    TranslationTable.prototype.constructor = TranslationTable;


    //tweakable multiplier to weight the score of words with repeating letters.
    cs.multiplier = 2;

    //Make a countable copy of the word
    cs.wordToListObj = function (word) {
        var listObj = {};
        for (var n = 0 ; n<word.length;n++){
            if (listObj.hasOwnProperty(word[n])) {
                listObj[word[n]] += 1;
            } else listObj[word[n]] = 1;
        }
        return listObj;
    }


    cs.scoreWord = function (word){
        var score=0;
        for (letter in wordToListObj(word)) {
            score += (obj[letter]===1)?1:multiplier*obj[letter];
        }
        return score;
    }


    //Generate a regex using a specific candidate table and 
    cs.makeRegex = function(str){
        var strAsArray = str.split('');

    }

}())
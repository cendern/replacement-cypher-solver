//CipherWord.getRegExp() is not always returning valid values. Mostly they come back empty.
//  break somewhere in getRegExpInner

//get the dictionary
function reqListener() {
    console.log(this.responseText);
}

//var oReq = new XMLHttpRequest();
//oReq.open("GET", "20kcommonwords.txt");
//oReq.send();
var cipherTextSolver = {};
document.addEventListener("DOMContentLoaded", function () {
    cipherTextSolver.celebrityCipherSettings = {
        allowDuplicates:false
    }
    cipherTextSolver.settings = cipherTextSolver.celebrityCipherSettings;

    //Function to pass out a new copy of the complete alphabet.
    cipherTextSolver.getAlphabetArray = function () {
        return 'abcdefghijklmnopqrstuvwxyz'.split('');
    };

    cipherTextSolver.cipherLetters = [];
    cipherTextSolver.cipherWords = [];

    cipherTextSolver.parseInput = function (text) {
        //initialize datasets from scratch
        cipherTextSolver.cipherLetters = [];
        cipherTextSolver.cipherWords = [];
        var wordsArray = text.split(' ');
        wordsArray.forEach(function (el) {
            cipherTextSolver.cipherWords.push(
                new cipherTextSolver.CipherWord(
                    el.split('').map(function (letter) {
                        var ref = cipherTextSolver.cipherLetters.find(function (el) {
                            return (el.cipherLetter === letter.toLowerCase());
                        });
                        if (typeof(ref) === 'undefined') {
                            //Don't have a CipherLetter for this one yet. Make it and return it.
                            ref = new cipherTextSolver.CipherLetter(letter);
                            cipherTextSolver.cipherLetters.push(ref);
                        }
                        return ref;
                    })
                )
            );
        });
    }

    document.getElementById('reread').onclick = function (e) {
        var ta = document.getElementById('cipherTextAreaId');
        cipherTextSolver.parseInput(ta.textContent);
        cipherTextSolver.recreateRegexes();
        cipherTextSolver.recreateClearText();
    };

    document.getElementById('refine').onclick = function (e) {
        cipherTextSolver.recreateRegexes();
        cipherTextSolver.recreateClearText();
    };

    cipherTextSolver.populateOL = function (olId, arry) {
        var node = document.getElementById(olId);
        while (node.hasChildNodes()) {
            node.removeChild(node.lastChild);
        }
        arry.forEach(function (el) {
            //Remove all the existing elements first
            var li = document.createElement('li');
            li.textContent = el;
            node.appendChild(li);
        });
    }

    cipherTextSolver.recreateRegexes = function() {
        cipherTextSolver.populateOL('resultTextAreaId', cipherTextSolver.getRegexes());
    }

    cipherTextSolver.getRegexes = function () {
        return cipherTextSolver.cipherWords.map(function (word) {
            return word.getRegExp();
        })
    };

    cipherTextSolver.getClearText = function () {
        return cipherTextSolver.cipherWords.map(function (word) {
            return word.getClearText();
        })
    };

    cipherTextSolver.recreateClearText = function () {
        cipherTextSolver.populateOL('clearText', cipherTextSolver.getClearText());
    }

    //IIFE to keep global scope clear
    cipherTextSolver.CipherWord = function(CipherLettersArry){
        this.cipherLetters = CipherLettersArry;

        //handle special case of single-letter word ('a' or 'I')
        if (this.cipherLetters.length === 1) {
            this.cipherLetters[0].setLetters(['a', 'i']);
        }
    }

    cipherTextSolver.CipherWord.prototype = {
        cipherLetters:[],
        getRegExpInner: function () {
            //Fix this to generate RegExp expressions that represent 
            // repeating characters properly, i.e. ciphertext 'wuu'
            // where w=['a'] and u=['l','e'] should match 'all' but 
            // not 'ale'.
            //Do this by writing the example RegExp as '[a]([le])\1' 
            // rather than '[a][le][le]'

            //this results in so many capture groups that it's likely to go into double digits which isn't ok.
            //var thisCipherLetters = this.cipherLetters;
            //var results = this.cipherLetters.map(function (cipherLetter, index) {


            //    //if this isn't the first instance of this cipherLetter
            //    if (thisCipherLetters.indexOf(cipherLetter) !== index) {

            //    }
                    
            //        //if there are more instances of this one after
            //    if (thisCipherLetters.indexOf(cipherLetter,index+1)){

            //    }

            //    //if the first instance of this letter isn't this instance
            //    if (thisCipherLetters.indexOf(cipherLetter) !== index) {
            //        return "\\" + index;
            //    } else return "(" + cipherLetter.getRegExpStr() + ")";
            //});

            ////remove extra parens (optional, might be worthwhile to simplify the regexes)
            //results.forEach(function (chr, index) {
            //    if (chr.)
            //});
            //var index = 0;
            
            //can't use 'this' inside another function so get another reference
            thisCipherLetters = this.cipherLetters;
            var len = this.cipherLetters.length;
            
            //Empty array to which we will write results non-linearly (which is why
            // it's initialized to the correct length here).
            var resultsArray = Array(len);
            var ctr = 0;

            //recursively replace successive instances of the same character with regular
            //expression backreferences, and put the initial instance in a capturing group.
            function f(idx) {
                if ((idx + 1) >= len) {
                    //this is the last character
                    if (typeof(resultsArray[idx]) === "undefined") {
                        resultsArray[idx] = thisCipherLetters[idx].getRegExpStr();
                    }
                } else {
                    //find and process each of the following instances of this cipherLetter.

                    //If this element has already been processed, skip this block
                    if (typeof(resultsArray[idx]) === "undefined") {
                        var currentCipherLetter = thisCipherLetters[idx];
                    
                        //Find the next instance of this cipherLetter (if there is one)
                        var positionOfNextInstance = thisCipherLetters.indexOf(currentCipherLetter, idx+1);
                        if (positionOfNextInstance > -1) {
                            resultsArray[idx] = '('+thisCipherLetters[idx].getRegExpStr()+')';
                            //the previous backreference counter 'ctr' was either '0' (invalid) or
                            // it was already used, so increment it to get a valid one.
                            ctr +=1;
                            while (positionOfNextInstance > -1) {
                            
                                //Replace this instance with a backreference to the first instance.
                                resultsArray[positionOfNextInstance] = '\\'+ctr;
                            
                                //reset positionOfNextInstance to the next instance.
                                positionOfNextInstance = thisCipherLetters.indexOf(currentCipherLetter, positionOfNextInstance+1);
                            }
                        } else {
                            //This is the only instance so we don't need a capturing group.
                            resultsArray[idx] = thisCipherLetters[idx].getRegExpStr();
                        }
                    }
                    f(idx + 1);
                }
            }

            //do the processing
            f(0);

            //when I know I'm repeating a letter, 


            return resultsArray;

            //var lettersAlreadySeen = [];
            //var seenAtIndex = [];
            //var encloseThis = [];
            //var resultArray = [];

            //resultArray = this.cipherLetters.map(function (cipherLetter, index) {
            //    var atIdx = lettersAlreadySeen.indexOf(cipherLetter);
            //    if (atIdx > -1) {
            //        //already seen this letter at atIdx
            //        return '\\' + encloseThis.push(atIdx);
            //    } else {
            //        lettersAlreadySeen.push(cipherLetter);
            //        seenAtIndex.push(index);
            //        return cipherLetter.getRegExpStr();
            //    }
            //});

            //lettersAlreadySeen.forEach(function (el, i) {
            //    //If there were multiple instances of this letter,
            //    // surround the first instance with '()'
            //    if (encloseThis.indexOf(i) > -1) {
            //        resultArray[i] = '(' + resultArray[i] + ')';
            //    }
            //});
            //return resultArray;
        },
        getRegExp: function () {
            return new RegExp("^" + this.getRegExpInner().join('') + "$");
        },
        isComplete: function () {
            //Tell whether all member CipherLetters have only one value
            return (
                typeof(this.cipherLetters.find(function (el) {
                    return el.possibleChars.length != 1;
                })) !== 'undefined'
            );
        },
        isWord: function () {
            //Return true if the word is found in the dictionary, false otherwise.
            return (this.getPossibleWords() !== null);
        },
        getClearText: function() {
            return this.cipherLetters.map(function (cipherLetter) {
                if (cipherLetter.possibleChars.length === 1) {
                    return cipherLetter.possibleChars[0];
                } else return '\u2588';
            }).join('');
        },
        hasLetter: function () { },
        getPossibleWords: function () {
            return dict.match(this.getRegExp());
        }
    };

    cipherTextSolver.CipherLetter = function(letter) {
        //Initialize it to the entire alphabet since we start off not knowing anything about it.

        //ToDo:convert pasted non-ASCII character sets to ASCII
        this.cipherLetter = letter.toLowerCase();
        if (this.cipherLetter.match('[a-z]')) {
            this.possibleChars = cipherTextSolver.getAlphabetArray();
        } else {
            //Punctuation handled here.
            //It's a special case because it usually isn't replaced 
            // by another character during encyphering, so treat it
            // like it's just another letter in the word except that
            // we happen to know its value already.
            this.possibleChars = [this.cipherLetter];
        }
    }

    cipherTextSolver.CipherLetter.prototype = {
        cipherLetter: "$",
        possibleChars:['d','e','f','a','u','l','t'],
        getRegExpStr: function () {
            return '[' + ((this.possibleChars.length > 1) ? this.possibleChars.join('') : this.possibleChars[0]) + ']';
        },
        removeLetter: function (letter) {
            //Remove 'letter' from possibleChars
            var index = this.possibleChars.indexOf(letter);
            if (index > -1) {
                this.possibleChars = this.possibleChars.splice(index, 1);
                if (this.possibleChars.length === 1) {
                    //remove this char from the possibleChars arrays of all the other CipherLetter objects
                    removeLetterFromAll(letter,this);
                } else if (this.possibleChars.length === 0) {
                    console.log("oops, ran out of candidate letters");
                }
            } else console.log('In CipherWord.removeLetter: \'' + letter + '\' was not in possibleChars');
        },
        setLetters: function (lettersArrayOrig) {
            //TODO: make sure lettersArrayOrig doesn't contain duplicate entries or our size check near the end is unreliable.

            lettersArray = lettersArrayOrig.slice();
            //if lettersArray is a subset of the existing letters, 
            // replace the existing set with the members of 
            // lettersArray.
            //Otherwise replace possibleChars with the union of the 
            // lettersArray and possibleChars sets.
            var outerThis = this;
            lettersArray.forEach(function (letter) {
                if (!(outerThis.possibleChars.indexOf(letter) > -1)) {
                    //Remove non-overlapping letter from lettersArray
                    lettersArray.splice(lettersArray.indexOf(letter), 1);
                    console.log('In CipherWord.setLetters: \'' + letter + '\' was not in possibleChars');
                }
            });
            if (this.possibleChars.length !== lettersArray.length) {
                this.possibleChars = lettersArray;
                if (this.possibleChars.length === 1) {
                    //remove this char from the possibleChars arrays of all the other CipherLetter objects
                    removeLetterFromAll(this.possibleChars[0],this);
                }
            }
        }
    };

    //Remove a letter from all instances of the CipherLetter object 
    // other than the instance referenced by 'exceptThisOne'
    //Only runs if settings.allowDuplicates is false;
    cipherTextSolver.removeLetterFromAll = function(letter,exceptThisOne) {
        if (settings.allowDuplicates === false) {
            cipherLetters.forEach(function (el) {
                if (el !== exceptThisOne)
                    el.removeLetter(letter);
            });
        }
    }
});

////Adding in guesses
//orig = "odh".split('');
//trans = "btr".split('');
//cipherTextSolver.cipherLetters.forEach(function (el) {
//    var pos = orig.indexOf(el.cipherLetter);
//    if (pos > -1) el.possibleChars = trans[pos];
//});

////Adding in guesses
function r(crypt,clear){
    orig = crypt.split('');
    trans = clear.split('');
    cipherTextSolver.cipherLetters.forEach(function (el) {
        var pos = orig.indexOf(el.cipherLetter);
        if (pos > -1) el.possibleChars = trans[pos];
    });
    cipherTextSolver.recreateRegexes();
    cipherTextSolver.recreateClearText();
}

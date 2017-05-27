//CipherWord.getRegExp() is not always returning valid values. Mostly they come back empty.
//  break somewhere in getRegExpInner

document.addEventListener("DOMContentLoaded", function () {
    celebrityCipherSettings = {
        allowDuplicates:false
    }
    settings = celebrityCipherSettings;

    function getAlphabetArray() {
        return 'abcdefghijklmnopqrstuvwxyz'.split('');
    }

    var cipherLetters = [];
    var cipherWords = [];

    function parseInput(text) {
        var wordsArray = text.split(' ');

        wordsArray.forEach(function (el) {
            cipherWords.push(
                new CipherWord(
                    el.split('').map(function (letter) {
                        var ref = cipherLetters.find(function (el) {
                                return (el.cipherLetter === letter.toLowerCase())
                        });
                        if (typeof(ref) === 'undefined') {
                            //Don't have a CipherLetter for this one yet. Make it and return it.
                            ref = new CipherLetter(letter);
                            cipherLetters.push(ref);
                        }
                        return ref;
                    })
                )
            );
        });
    }

    document.getElementById('decrypt').onclick = function (e) {
        var ta = document.getElementById('cipherTextAreaId');
        parseInput(ta.textContent);
        prh();
    };

    function getResult() {
        return cipherWords.map(function (word) {
            return word.getRegExp()
        })
    };

    function prh() {
        var str = getResult();
        document.getElementById('resultTextAreaId').textContent = str.join(' ');
    }
    //IIFE to keep global scope clear
    function CipherWord(CipherLettersArry){
        this.cipherLetters = CipherLettersArry;

        //handle special case of single-letter word ('a' or 'I')
        if (this.cipherLetters.length === 1) {
            this.cipherLetters[0].setLetters(['a', 'i']);
        }
    }

    CipherWord.prototype = {
        cipherLetters:[],
        getRegExpInner: function () {
            //Fix this to generate RegExp expressions that represent 
            // repeating characters properly, i.e. ciphertext 'wuu'
            // where w=['a'] and u=['l','e'] should match 'all' but 
            // not 'ale'.
            //Do this by writing the example RegExp as '[a]([le])\1' 
            // rather than '[a][le][le]'

            var lettersAlreadySeen = [];
            var seenAtIndex = [];
            var seenAgain = [];
            var resultArray = [];

            resultArray = this.cipherLetters.map(function (cipherLetter, index) {
                var atIdx = lettersAlreadySeen.indexOf(cipherLetter);
                if (atIdx > -1) {
                    //already seen this letter at atIdx
                    stuff = '\\' + seenAtIndex[atIdx];
                    seenAgain.push(atIdx);
                } else {
                    stuff = cipherLetter.getRegExpStr();
                    lettersAlreadySeen.push(cipherLetter);
                    seenAtIndex.push(index);
                }
                return stuff;
            });
            lettersAlreadySeen.forEach(function (el, i) {
                //If there were multiple instances of this letter,
                // surround the first instance with '()'
                if (seenAgain.indexOf(i) > -1) {
                    resultArray[i] = '(' + el + ')';
                }
            });
            return resultArray;
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
        hasLetter: function () { },
        getPossibleWords: function () {
            return dict.match(this.getRegExp());
        }
    };

    function CipherLetter(letter) {
        //Initialize it to the entire alphabet since we start off not knowing anything about it.
        this.cipherLetter = letter.toLowerCase();
        this.possibleChars = getAlphabetArray();
    }

    CipherLetter.prototype = {
        cipherLetter: "$",
        possibleChars:['d','e','f','a','u','l','t'],
        getRegExpStr: function () {
            return '['+this.possibleChars.join('')+']';
        },
        removeLetter: function (letter) {
            //Remove 'letter' from possibleChars
            var index = this.possibleChars.indexOf(letter);
            if (index > -1) {
                this.possibleChars = this.possibleChars.splice(index, 1);
                if (this.possibleChars.length === 1) {
                    //remove this char from the possibleChars arrays of all the other CipherLetter objects
                    removeLetterFromAll(letter,this);
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
    function removeLetterFromAll(letter,exceptThisOne) {
        if (settings.allowDuplicates === false) {
            cipherLetters.forEach(function (el) {
                if (el !== exceptThisOne)
                    el.removeLetter(letter);
            });
        }
    }
});

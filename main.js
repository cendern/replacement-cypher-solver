//CipherWord.getRegExp() is not always returning valid values. Mostly they come back empty.
//  break somewhere in getRegExpInner

//get the dictionary

var cipherTextSolver = {};
//(function () {
//    function reqListener() {
//        cipherTextSolver.wordList = this.responseText;
//    }
//    var oReq = new XMLHttpRequest();
//    oReq.addEventListener("load", reqListener);
//    oReq.open("GET", "https://rawgit.com/cendern/replacement-cypher-solver/master/20kcommonwords.txt");
//    oReq.send();
//}());

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
        cipherTextSolver.populateCandidateWords();
        cipherTextSolver.recreateClearText();
    };

    document.getElementById('refine').onclick = function (e) {
        cipherTextSolver.recreateRegexes();
        cipherTextSolver.populateCandidateWords();
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

    cipherTextSolver.populateCandidateWords = function () {
        cipherTextSolver.populateOL('matchesTextAreaId', cipherTextSolver.getCandidateWords());
    }

    cipherTextSolver.getCandidateWords = function () {
        return cipherTextSolver.cipherWords.map(function (word) {
            var rgxp = word.getRegExp();
            var matches;
            matches = bigList.filter(function(el){
                return el.match(rgxp);
            });
            if (matches.length > 15) {
                return matches[0] + "(+" + (matches.length - 1) + " more)";
            } else {
                word.setPossibleWords(matches);
                return matches.join('_');
            }
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

    //return an array that is the intersection of two arrays
    cipherTextSolver.intersect = function (a, b) {
        return a.filter(function (el) {
            return (b.includes(el));
        });
    }

    //IIFE to keep global scope clear
    cipherTextSolver.CipherWord = function(CipherLettersArry,isName){
        this.cipherLetters = CipherLettersArry;
        this.isName = (typeof (isName) === 'undefined' || typeof (isName) !== 'boolean') ? false : isName;
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
            return new RegExp("^" + this.getRegExpInner().join('') + "$",'i');
            //return new RegExp("^" + this.getRegExpInner().join('') + "$");
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
        _possibleWords: [],
        isName:false,
        setPossibleWords: function(wordsArray){
            if (wordsArray.length !== 0) {
                //save a copy of the array
                this._possibleWords = wordsArray.slice();
                //Now update the possible characters
                //For each character position in the word, get all the possible candidates
                //from the word.
                //Skip if this word is known to be a name.
                if (!this.isName) {
                    var list = Array(this.cipherLetters.length);
                    for (var n = 0; n < list.length; n++) {
                        list[n] = [];
                    }
                    this._possibleWords.forEach(function (word) {
                        word.split('').forEach(function (letter,idx) {
                            var ltr = letter.toLowerCase();
                            if (list[idx].indexOf(ltr) === -1) {
                                list[idx].push(ltr);
                            }
                        });
                    });
                    //Now replace this word's cipherLetter .possibleChars with
                    //the intersection of the appropriate sub array of list 
                    // and the existing list of .possibleChars
                    //Ignore non-letter characters (always include)
                    this.cipherLetters.forEach(function (letter,idx) {
                        letter.possibleChars = list[idx].filter(function (el) {
                            return (letter.possibleChars.includes(el));
                        });
                    });
                }
            }
        },
        getPossibleWords: function () {
            //return a copy of the array
            return this._possibleWords.slice();
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

    cipherTextSolver.solveIt = function () {
        cipherTextSolver.cipherWords.forEach(function (cipherWord) {
            matches = Word_List.wordList.filter(function (el) {
                return (!!el.match(regexp));
            });
            //matches is an array of all the matching words.
            //Use the results to pare down the possibleChars list for each cipherLetter.
            //Example: regexp is "[ai]([a-z])\1$" (using a-z because I don't want to write it all out)
            //matches is ["add", "all", "ann", "ass", "iff", "ill", "inn"]
            //cipherWord is VNN
            //new regexp is "^[ai][dlnsf]$" because the second (and third) letters make the set "dlnsf".
            
            //determine the new regex based solely on these results
            
            //get the existing possibleChars arrays

            //intersect them
            //bestMatches = matchesLetters.filter(function (el,idx) {
            //    el.
            //});
            //assign the intersection to possibleChars.
        });
    }

    //Adding in guesses
    cipherTextSolver.assertTranslation = function (crypt, clear) {
        orig = crypt.split('');
        trans = clear.split('');
        cipherTextSolver.cipherLetters.forEach(function (el) {
            var pos = orig.indexOf(el.cipherLetter);
            if (pos > -1) el.possibleChars = trans[pos];
        });
        cipherTextSolver.recreateRegexes();
        cipherTextSolver.recreateClearText();
    }
    document.getElementById('reread').onclick = function (e) {
        var ta = document.getElementById('cipherTextAreaId');
        cipherTextSolver.parseInput(ta.textContent);
        cipherTextSolver.recreateRegexes();
        cipherTextSolver.recreateClearText();
    };

    //Each letter is a property that has a value equal to its translated value.
    cipherTextSolver.translationTable = {};
    (function(){
        //from:
        //<div contenteditable id="translateFrom"></div>
        //to:
        //<div contenteditable id="translateTo"></div>
        //<button id="applyTranslation">Apply</button>
        //<ul id="letterMappings">
        var toEl = document.getElementById('translateTo');
        var fromEl = document.getElementById('translateFrom');
        var btn = document.getElementById('applyTranslation');
        var ul = document.getElementById('letterMappings');
        handleTranslation = (function (fromEl, toEl, btn) {
            return function () {
                from = fromEl.textContent.toLowerCase();
                to = toEl.textContent.toLowerCase();
                if (to.length !== from.length) {
                    btn.disabled = true;
                } else if (!(from.match("[a-z-']*") && to.match("[a-z-']*"))) {
                    btn.disabled = true;
                } else {
                    //Make sure translation is internally consistent (ab->cd is ok, aa->cd is not ok)
                    var tt = {};
                    var failed = false;
                    from.split('').forEach(function (el, idx) {
                        var toChar = to.substring(idx, idx + 1);
                        if (tt.hasOwnProperty(el)) {
                            if (tt[el] !== toChar) failed = true;
                        } else tt[el] = toChar;
                    });
                    if (failed) {
                        btn.disabled = true;
                    } else {
                        btn.disabled = false;
                        //Now make sure it's consistent with the translations we already have:
                    }

                }
            }
        }(fromEl, toEl, btn));

        fromEl.onkeyup = handleTranslation;
        toEl.onkeyup = handleTranslation;

        btn.onclick = (function (fromEl, toEl) {
            return function () {
                var from = fromEl.textContent.toLowerCase();
                var to = toEl.textContent.toLowerCase();
                cipherTextSolver.assertTranslation(from, to);
                from.split('').forEach(function (el, idx) {
                    var li = document.createElement('li');
                    li.textContent = el + "=" + to.substring(idx,idx+1);
                    li.setAttribute('data-from', from);
                    ul.appendChild(li);
                });
            }
        }(fromEl, toEl));
        function deleteGuess(e) {
            var fromChars = this.getAttribute('data-from').split('');
            //Reset the possibleChars on each of these chars to [a-z]
            //and then apply any other guesses.
        }
    }());


});
//var rgxp = cipherTextSolver.cipherWords[0].getRegExp();
//var matches;
//function junk(){
//matches = bigList.filter(function(el){
//    return el.match(rgxp);
//});}
//


/*
The MIT License (MIT)

Copyright (c) 2016 Callum Hart

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

(function() {
  var CompleteMe, Keyboarding, Utils, noop,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  noop = function() {};

  CompleteMe = (function() {
    CompleteMe.prototype.defaultOptions = {
      data: [],
      placeholder: "Type here...",
      noResultsText: "Couldn't find",
      canAddNewRecordsText: "Hit <span class=\"cm-key\">enter</span> to add",
      fetchingMoreResultsText: "Fetching more results...",
      canAddNewRecords: false,
      onAdd: noop,
      onSelect: noop,
      onNoResults: noop,
      onFocussed: noop,
      onBlurred: noop,
      onKeyedDown: noop,
      onKeyedUp: noop,
      onShowSuggestion: noop,
      onClearSuggestion: noop,
      onSuggestionSelected: noop,
      suggestResult: false,
      saveByValue: true
    };

    CompleteMe.prototype.domCap = 10;

    CompleteMe.prototype.resultsOpen = false;

    CompleteMe.prototype.resultsAreObjects = false;

    CompleteMe.prototype.version = "0.1.1";

    function CompleteMe(selector, options) {
      this.updateData = bind(this.updateData, this);
      this.onMouseDown = bind(this.onMouseDown, this);
      this.onScroll = bind(this.onScroll, this);
      this.onBlur = bind(this.onBlur, this);
      this.onFocus = bind(this.onFocus, this);
      this.onKeyDown = bind(this.onKeyDown, this);
      this.onKeyUp = bind(this.onKeyUp, this);
      this.handleElm(selector);
      if (this.elm) {
        this.options = Utils.extend({}, this.defaultOptions, options);
        this.allResults = this.options.data;
        this.handleTemplate();
        this.bindPersistentEvents();
        if (this.allResults.length > 0) {
          this.resultsAreObjects = typeof this.options.data[0] === "object";
          this.handleInitialResults();
        }
      } else {
        console.warn("CompleteMe couldn't find and initialize " + selector);
      }
    }

    CompleteMe.prototype.handleElm = function(selector) {
      if (typeof selector === "string") {
        return this.elm = document.querySelector(selector);
      } else if (typeof selector === "object") {
        if (selector.nodeName) {
          return this.elm = selector;
        }
      }
    };

    CompleteMe.prototype.bindPersistentEvents = function() {
      return this.input.addEventListener("focus", this.onFocus);
    };

    CompleteMe.prototype.bindEvents = function() {
      this.input.addEventListener("keyup", this.onKeyUp);
      this.input.addEventListener("keydown", this.onKeyDown);
      this.input.addEventListener("blur", this.onBlur);
      this.resultsWrapperElm.addEventListener("scroll", Utils.throttle(this.onScroll, 25));
      return this.resultsWrapperElm.addEventListener("mousedown", this.onMouseDown);
    };

    CompleteMe.prototype.unbindEvents = function() {
      this.input.removeEventListener("keyup", this.onKeyUp);
      this.input.removeEventListener("keydown", this.onKeyDown);
      this.input.removeEventListener("blur", this.onBlur);
      this.resultsWrapperElm.removeEventListener("scroll", this.onScroll);
      return this.resultsWrapperElm.removeEventListener("mousedown", this.onMouseDown);
    };

    CompleteMe.prototype.onKeyUp = function(e) {
      var alphanumeric, backspace, enter, space, value;
      value = e.target.value;
      alphanumeric = Keyboarding.isAlphanumeric(e.keyCode);
      backspace = Keyboarding.isBackspace(e.keyCode);
      space = Keyboarding.isSpace(e.keyCode);
      enter = Keyboarding.isEnter(e.keyCode);
      if (alphanumeric || backspace || space) {
        if (!this.resultsOpen) {
          this.showResults();
        }
        this.handleSearch(value);
        return this.options.onKeyedUp(value);
      } else if (enter && this.selectedResult) {
        this.handleSelectedResult();
        return this.resultsOpen = false;
      } else if (this.options.canAddNewRecords && Utils.present(value) && enter) {
        this.input.focus();
        this.hideResults();
        return this.options.onAdd(value);
      }
    };

    CompleteMe.prototype.onKeyDown = function(e) {
      var backspace, enter, selectSuggestion;
      backspace = Keyboarding.isBackspace(e.keyCode);
      enter = Keyboarding.isEnter(e.keyCode);
      if (Keyboarding.isUpOrDown(e.keyCode)) {
        e.preventDefault();
        if (this.domResults.length > 0) {
          this.handleUpOrDown(Keyboarding.upAndDownKeys[e.keyCode]);
        }
      }
      if (Keyboarding.isRightOrTab(e.keyCode)) {
        selectSuggestion = this.options.suggestResult && this.input.value && this.suggestionElm.dataset.result.length > 0 && this.suggestionElm.dataset.result.length > this.input.value.length;
        if (selectSuggestion) {
          e.preventDefault();
          this.selectSuggestedResult(Keyboarding.rightAndTabKeys[e.keyCode]);
        }
      }
      if (enter) {
        e.preventDefault();
      }
      return this.options.onKeyedDown(e);
    };

    CompleteMe.prototype.onFocus = function() {
      var topResult;
      this.bindEvents();
      if (this.allResults.length > 0 && this.options.suggestResult) {
        if (this.resultsAreObjects) {
          topResult = this.domResults[0].value;
        } else {
          topResult = this.domResults[0];
        }
        this.handleSuggestion(topResult);
      }
      this.handleSearch(this.input.value);
      this.showResults();
      Utils.addClass("focussed", this.elm);
      return this.options.onFocussed();
    };

    CompleteMe.prototype.onBlur = function() {
      this.unbindEvents();
      this.hideResults();
      Utils.removeClass("focussed", this.elm);
      return this.options.onBlurred();
    };

    CompleteMe.prototype.onScroll = function(e) {
      var endIndex, startIndex;
      startIndex = Math.round(this.resultsWrapperElm.scrollTop / this.singleResultHeight);
      endIndex = startIndex + this.domCap;
      if (endIndex <= this.options.data.length) {
        if (startIndex !== this.previousScrollIndex) {
          this.domResults = this.allResults.slice(startIndex, endIndex);
          this.handleResults(startIndex);
          this.handleScroll(startIndex);
          this.addScrollSpace();
          if (this.manualScroll) {
            this.handleActiveState();
          } else {
            this.selectedIndex = startIndex;
          }
          this.manualScroll = false;
          this.selectedResult = null;
        }
        return this.previousScrollIndex = startIndex;
      }
    };

    CompleteMe.prototype.onMouseDown = function(e) {
      var resultsPresent;
      if (e.target !== this.resultsWrapperElm) {
        resultsPresent = this.allResults.length > 0;
        if (resultsPresent) {
          this.selectedResult = e.target.querySelector("a");
          this.selectedIndex = parseInt(this.selectedResult.dataset.index);
          this.handleActiveState();
          this.handleSelectedResult();
          return window.requestAnimationFrame((function(_this) {
            return function() {
              _this.input.focus();
              return _this.hideResults();
            };
          })(this));
        }
      }
    };

    CompleteMe.prototype.handleInitialResults = function() {
      var startIndex, value;
      if (this.options.selectedValue) {
        this.setSaveValue(this.options.selectedValue);
        this.setValue(this.options.selectedValue);
      }

      /*
        If completeMe has an existing value selected by its key name
        i.e [{ key: "id", value: "John Smith" },...]
        selectedKey: "id" would set the value of the input to "John Smith"
       */
      if (this.options.selectedKey) {
        if (Utils.present(this.options.selectedKey)) {
          value = Utils.where("key", this.options.selectedKey, this.options.data)[0].value;
          if (this.options.saveByValue) {
            this.setSaveValue(value);
          } else {
            this.setSaveValue(this.options.selectedKey);
          }
          return this.setValue(value);
        }
      } else {
        startIndex = 0;
        this.selectedIndex = -1;
        this.domResults = this.allResults.slice(startIndex, startIndex + this.domCap);
        this.insertSingleResultWrappers();
        return this.handleResults(startIndex);
      }
    };

    CompleteMe.prototype.setSaveValue = function(saveValue) {
      return this.elm.dataset.saveValue = saveValue;
    };

    CompleteMe.prototype.handleUpOrDown = function(direction) {
      var selectedResult;
      this.previousIndex = this.selectedIndex;
      if (direction === "DOWN" && this.selectedIndex + 1 < this.allResults.length) {
        this.selectedIndex++;
      }
      if (direction === "UP" && this.selectedIndex - 1 > -1) {
        this.selectedIndex--;
      }
      if (this.selectedIndex !== this.previousIndex) {
        selectedResult = this.elm.querySelector("a.index-" + this.selectedIndex);
        if (selectedResult) {
          return this.handleActiveState();
        } else if (this.allResults[this.selectedIndex]) {
          return this.updateDomResults(direction);
        }
      }
    };

    CompleteMe.prototype.handleSearch = function(value, searchFromCallback) {
      var endIndex, fetchingMoreResults, resultsPresent, startIndex;
      if (searchFromCallback == null) {
        searchFromCallback = false;
      }
      startIndex = 0;
      this.handleAllResults(value);
      resultsPresent = this.allResults.length > 0;
      this.selectedIndex = -1;
      this.selectedResult = null;
      if (resultsPresent) {
        if (this.allResults.length > this.domCap) {
          endIndex = this.domCap;
        } else {
          endIndex = this.allResults.length;
        }
        this.domResults = this.allResults.slice(startIndex, endIndex);
        this.insertSingleResultWrappers();
        this.handleResults(startIndex);
        return this.resultsWrapperElm.scrollTop = 0;
      } else {
        this.domResults = [];
        if (this.options.suggestResult) {
          this.clearSuggestion();
        }
        if (!searchFromCallback) {
          fetchingMoreResults = this.options.onNoResults(value);
          if (fetchingMoreResults) {
            return this.handleFetchingResults();
          } else {
            return this.handleNoResults(value);
          }
        } else {
          return this.handleNoResults(value);
        }
      }
    };

    CompleteMe.prototype.handleAllResults = function(value) {
      if (this.resultsAreObjects) {
        return this.allResults = Utils.findOccurrenceInObject(value, this.options.data);
      } else {
        return this.allResults = Utils.findOccurrenceInArray(value, this.options.data);
      }
    };

    CompleteMe.prototype.handleSelectedResult = function() {
      var key, ref;
      this.input.value = this.selectedResult.dataset.result;
      key = (ref = this.allResults[this.selectedResult.dataset.index]) != null ? ref.key : void 0;
      if (this.options.saveByValue) {
        this.setSaveValue(this.input.value);
      } else {
        this.setSaveValue(key);
      }
      this.options.onSelect(this.input.value, key);
      return this.hideResults();
    };

    CompleteMe.prototype.selectSuggestedResult = function(key) {
      this.input.value = this.suggestionElm.dataset.result;
      if (this.options.saveByValue) {
        this.setSaveValue(this.input.value);
      } else {
        this.options.selectedKey = Utils.where("value", this.input.value, this.options.data)[0].key;
        this.setSaveValue(this.options.selectedKey);
      }
      this.handleSearch(this.input.value);
      this.selectedResult = this.resultsElm.querySelector("a.index-0");
      return this.options.onSuggestionSelected(this.input.value, key);
    };

    CompleteMe.prototype.handleActiveState = function() {
      this.selectedResult = this.resultsElm.querySelector("a.index-" + this.selectedIndex);
      this.removeActiveState();
      Utils.addClass("active", this.selectedResult);
      if (this.options.suggestResult) {
        return this.handleSuggestion(this.selectedResult.dataset.result);
      }
    };

    CompleteMe.prototype.updateDomResults = function(direction) {
      var startIndex;
      if (direction === "DOWN") {
        startIndex = this.selectedIndex - (this.domCap - 1);
      }
      if (direction === "UP") {
        startIndex = this.selectedIndex;
      }
      this.manualScroll = true;
      return this.resultsWrapperElm.scrollTop = this.singleResultHeight * startIndex;
    };

    CompleteMe.prototype.updateData = function(newData) {
      this.options.data = newData;
      return this.handleSearch(this.input.value, true);
    };

    CompleteMe.prototype.setValue = function(value) {
      this.input.value = value;
      return this.handleSearch(value);
    };

    CompleteMe.prototype.render = function(elm, template) {
      return elm.innerHTML = template;
    };

    CompleteMe.prototype.handleTemplate = function() {
      this.containerClass = "cm-container";
      this.inputWrapperClass = "cm-input-wrap";
      this.resultsWrapperClass = "cm-results-wrap";
      this.resultsClass = "cm-results";
      this.noResultsClass = "cm-without-results";
      this.highlightedMatchClass = "cm-highlight";
      this.inputClass = "cm-input";
      this.suggestionClass = "cm-suggestion";
      this.tabindexSnippet = this.elm.dataset.tabindex ? "tabindex=" + this.elm.dataset.tabindex : "";
      this.template = "<div class=\"" + this.inputWrapperClass + "\">\n  <input type=\"text\" class=\"" + this.inputClass + "\" placeholder=\"" + this.options.placeholder + "\" " + this.tabindexSnippet + ">\n  <input type=\"text\" class=\"" + this.suggestionClass + "\" disabled>\n</div>\n<div class=\"" + this.resultsWrapperClass + "\">\n  <ul class=\"" + this.resultsClass + "\"></ul>\n</div>";
      this.singleResultWrapper = "<li></li>";
      this.singleResultContent = "<a href=\"#\" class=\"index-{{index}}\" data-result=\"{{dataResult}}\" data-index=\"{{dataIndex}}\">\n  {{result}}\n</a>";
      this.noResultsContent = "<li class=\"" + this.noResultsClass + "\">\n  <i>" + this.options.noResultsText + " \"{{searchValue}}\"</i>\n  {{canAddNewRecordsSnippet}}\n</li>";
      this.canAddNewRecordsSnippet = "<span>" + this.options.canAddNewRecordsText + "</span>";
      this.fetchingMoreResultsSnippet = "<p>" + this.options.fetchingMoreResultsText + "</p>";
      this.render(this.elm, this.template);
      Utils.addClass(this.containerClass, this.elm);
      this.inputWrap = this.elm.querySelector("." + this.inputWrapperClass);
      this.input = this.elm.querySelector("." + this.inputWrapperClass + " input");
      this.suggestionElm = this.elm.querySelector("." + this.suggestionClass);
      this.resultsWrapperElm = this.elm.querySelector("." + this.resultsWrapperClass);
      return this.resultsElm = this.elm.querySelector("." + this.resultsClass);
    };

    CompleteMe.prototype.insertSingleResultWrappers = function() {
      var i, resultWrapperSnippet;
      i = 0;
      resultWrapperSnippet = "";
      while (i < this.domResults.length) {
        resultWrapperSnippet += this.singleResultWrapper;
        i++;
      }
      this.render(this.resultsElm, resultWrapperSnippet);
      return this.addScrollSpace();
    };

    CompleteMe.prototype.addScrollSpace = function() {
      var artificialHeight, viewportHeight;
      this.singleResultHeight = this.resultsElm.querySelector("li").getBoundingClientRect().height;
      viewportHeight = this.singleResultHeight * this.domResults.length;
      artificialHeight = (this.allResults.length * this.singleResultHeight) - this.resultsWrapperElm.scrollTop;
      Utils.addHeight(viewportHeight + "px", this.resultsWrapperElm);
      return Utils.addHeight(artificialHeight + "px", this.resultsElm);
    };

    CompleteMe.prototype.handleResults = function(startIndex) {
      var domResult, index, j, len, ref, result, singleResultElm, singleResultsSnippet, topResult;
      ref = this.domResults;
      for (index = j = 0, len = ref.length; j < len; index = ++j) {
        result = ref[index];
        if (this.resultsAreObjects) {
          result = result.value;
        }
        if (this.input.value) {
          domResult = this.highlightSearchTerm(result);
        } else {
          domResult = result;
        }
        singleResultsSnippet = this.singleResultContent.replace("{{index}}", startIndex + index).replace("{{dataIndex}}", startIndex + index).replace("{{result}}", domResult).replace("{{dataResult}}", result);
        singleResultElm = this.resultsElm.querySelectorAll("li")[index];
        this.render(singleResultElm, singleResultsSnippet);
      }
      if (this.resultsAreObjects) {
        topResult = this.domResults[0].value;
      } else {
        topResult = this.domResults[0];
      }
      if (this.options.suggestResult && this.resultsOpen) {
        return this.handleSuggestion(topResult);
      }
    };

    CompleteMe.prototype.highlightSearchTerm = function(result) {
      return Utils.highlightCharacterInString(this.input.value, result, this.highlightedMatchClass);
    };

    CompleteMe.prototype.handleSuggestion = function(result) {
      var resultBeginsWithValue;
      this.clearSuggestion();
      if (this.input.value) {
        resultBeginsWithValue = result.toLowerCase().indexOf(this.input.value.toLowerCase()) === 0;
        if (resultBeginsWithValue) {
          return this.showSuggestion(result);
        }
      }
    };

    CompleteMe.prototype.showSuggestion = function(result) {
      var suggestion;
      suggestion = this.input.value + result.substring(this.input.value.length);
      this.suggestionElm.value = suggestion;
      this.suggestionElm.dataset.result = result;
      return this.options.onShowSuggestion(suggestion);
    };

    CompleteMe.prototype.clearSuggestion = function() {
      this.suggestionElm.value = "";
      this.suggestionElm.dataset.result = "";
      return this.options.onClearSuggestion();
    };

    CompleteMe.prototype.handleScroll = function(startIndex) {
      this.resultsElm.style.transform = "translate(0px, " + (startIndex * this.singleResultHeight) + "px)";
      return this.resultsElm.style.webkitTransform = "translate(0px, " + (startIndex * this.singleResultHeight) + "px)";
    };

    CompleteMe.prototype.handleFetchingResults = function() {
      return this.render(this.resultsElm, this.fetchingMoreResultsSnippet);
    };

    CompleteMe.prototype.handleNoResults = function(searchValue) {
      var canAddNewRecordsSnippet, noResultsSnippet;
      if (this.options.canAddNewRecords) {
        canAddNewRecordsSnippet = this.canAddNewRecordsSnippet;
      } else {
        canAddNewRecordsSnippet = "";
      }
      noResultsSnippet = this.noResultsContent.replace("{{searchValue}}", searchValue).replace("{{canAddNewRecordsSnippet}}", canAddNewRecordsSnippet);
      this.render(this.resultsElm, noResultsSnippet);
      Utils.addHeight("auto", this.resultsWrapperElm);
      return Utils.addHeight("auto", this.resultsElm);
    };

    CompleteMe.prototype.showResults = function() {
      this.resultsOpen = true;
      return Utils.addClass("results-showing", this.elm);
    };

    CompleteMe.prototype.hideResults = function() {
      this.resultsOpen = false;
      if (this.options.suggestResult) {
        this.clearSuggestion();
      }
      return Utils.removeClass("results-showing", this.elm);
    };

    CompleteMe.prototype.removeActiveState = function() {
      var activeResultElm;
      activeResultElm = this.resultsElm.querySelector("." + this.resultsClass + " a.active");
      if (activeResultElm) {
        return Utils.removeClass("active", activeResultElm);
      }
    };

    return CompleteMe;

  })();

  window.CompleteMe = CompleteMe;

  Utils = {
    extend: function() {
      var j, key, len, object, objects, target, val;
      target = arguments[0], objects = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      for (j = 0, len = objects.length; j < len; j++) {
        object = objects[j];
        for (key in object) {
          val = object[key];
          target[key] = val;
        }
      }
      return target;
    },
    where: function(key, value, array) {
      var results;
      results = [];
      array.filter(function(object) {
        if (typeof object === "object") {
          if (object[key] === value) {
            return results.push(object);
          }
        } else {
          if (object === value) {
            return results.push(object);
          }
        }
      });
      if (results.length > 0) {
        return results;
      }
    },
    addClass: function(className, elm) {
      return elm.classList.add(className);
    },
    removeClass: function(className, elm) {
      return elm.classList.remove(className);
    },
    addHeight: function(height, elm) {
      return elm.style.height = height;
    },
    findOccurrenceInArray: function(value, array) {
      var index, j, len, results, string;
      results = [];
      value = value.toLowerCase();
      for (index = j = 0, len = array.length; j < len; index = ++j) {
        string = array[index];
        if (string.toLowerCase().indexOf(value) > -1) {
          results.push(string);
        }
      }
      return results;
    },
    findOccurrenceInObject: function(value, array) {
      var index, j, len, object, results;
      results = [];
      value = value.toLowerCase();
      for (index = j = 0, len = array.length; j < len; index = ++j) {
        object = array[index];
        if (object.value.toLowerCase().indexOf(value) > -1) {
          results.push(object);
        }
      }
      return results;
    },
    highlightCharacterInString: function(match, string, highLightClass) {
      var regex;
      regex = new RegExp("(" + match + ")", "gi");
      return string.replace(regex, "<span class=" + highLightClass + ">$1</span>");
    },
    present: function(thing) {
      var result;
      if (typeof thing === "string") {
        result = thing.length > 0;
      }
      if (typeof thing === "number") {
        result = true;
      }
      return result;
    },
    throttle: function(func, wait, options) {
      var args, context, later, previous, result, timeout;
      context = void 0;
      args = void 0;
      result = void 0;
      timeout = null;
      previous = 0;
      if (!options) {
        options = {};
      }
      later = function() {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) {
          context = args = null;
        }
      };
      return function() {
        var now, remaining;
        now = Date.now();
        if (!previous && options.leading === false) {
          previous = now;
        }
        remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);
          if (!timeout) {
            context = args = null;
          }
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    }
  };

  Keyboarding = {
    alphanumericKeys: {
      48: "0",
      49: "1",
      50: "2",
      51: "3",
      52: "4",
      53: "5",
      54: "6",
      55: "7",
      56: "8",
      57: "9",
      96: "0",
      97: "1",
      98: "2",
      99: "3",
      100: "4",
      101: "5",
      102: "6",
      103: "7",
      104: "8",
      105: "9",
      65: "a",
      66: "b",
      67: "c",
      68: "d",
      69: "e",
      70: "f",
      71: "g",
      72: "h",
      73: "i",
      74: "j",
      75: "k",
      76: "l",
      77: "m",
      78: "n",
      79: "o",
      80: "p",
      81: "q",
      82: "r",
      83: "s",
      84: "t",
      85: "u",
      86: "v",
      87: "w",
      88: "x",
      89: "y",
      90: "z"
    },
    upAndDownKeys: {
      38: "UP",
      40: "DOWN"
    },
    rightAndTabKeys: {
      39: "RIGHT",
      9: "TAB"
    },
    isAlphanumeric: function(keyCode) {
      if (this.alphanumericKeys[keyCode]) {
        return true;
      } else {
        return false;
      }
    },
    isUpOrDown: function(keyCode) {
      if (this.upAndDownKeys[keyCode]) {
        return true;
      } else {
        return false;
      }
    },
    isRightOrTab: function(keyCode) {
      if (this.rightAndTabKeys[keyCode]) {
        return true;
      } else {
        return false;
      }
    },
    isBackspace: function(keyCode) {
      if (keyCode === 8) {
        return true;
      } else {
        return false;
      }
    },
    isEnter: function(keyCode) {
      if (keyCode === 13) {
        return true;
      } else {
        return false;
      }
    },
    isSpace: function(keyCode) {
      if (keyCode === 32) {
        return true;
      } else {
        return false;
      }
    }
  };

}).call(this);

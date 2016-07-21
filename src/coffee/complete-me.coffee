###
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
###

noop = ->

class CompleteMe
  defaultOptions:
    data: []
    placeholder: "Type here..."
    noResultsText: "Couldn't find"
    canAddNewRecordsText: """Hit <span class="cm-key">enter</span> to add"""
    fetchingMoreResultsText: "Fetching more results..."
    canAddNewRecords: no
    onAdd: noop
    onSelect: noop
    onNoResults: noop
    onFocussed: noop
    onBlurred: noop
    onKeyedDown: noop
    onKeyedUp: noop
    onShowSuggestion: noop
    onClearSuggestion: noop
    onSuggestionSelected: noop
    suggestResult: no
    saveByValue: yes

  domCap: 10 # Number of results in the DOM, perhaps make a config option? (dropdown height is li height * domCap)
  resultsOpen: no
  resultsAreObjects: no
  version: "0.1.1"

  constructor: (selector, options) ->
    @handleElm selector

    if @elm
      @options = Utils.extend {}, @defaultOptions, options
      @allResults = @options.data
      @handleTemplate()
      @bindPersistentEvents()
      if @allResults.length > 0
        @resultsAreObjects = typeof @options.data[0] is "object"
        @handleInitialResults()
    else
      console.warn "CompleteMe couldn't find and initialize #{selector}"

  # You can initialize completeMe with a class/id selector or with an actual DOM element.
  handleElm: (selector) ->
    if typeof selector is "string"
      @elm = document.querySelector selector
    else if typeof selector is "object"
      # Check that object is an actual dom element.
      if selector.nodeName
        @elm = selector

  # ************************************************************
  # Events
  # ************************************************************

  bindPersistentEvents: -> # Events that listen even when autocomplete isn't being used.
    @input.addEventListener "focus", @onFocus

  bindEvents: ->
    @input.addEventListener "keyup", @onKeyUp
    @input.addEventListener "keydown", @onKeyDown
    @input.addEventListener "blur", @onBlur
    @resultsWrapperElm.addEventListener "scroll", Utils.throttle(@onScroll, 25)
    @resultsWrapperElm.addEventListener "mousedown", @onMouseDown # Work around for pointer events none on the anchor, and also is more performant :)

  unbindEvents: ->
    @input.removeEventListener "keyup", @onKeyUp
    @input.removeEventListener "keydown", @onKeyDown
    @input.removeEventListener "blur", @onBlur
    @resultsWrapperElm.removeEventListener "scroll", @onScroll
    @resultsWrapperElm.removeEventListener "mousedown", @onMouseDown

  onKeyUp: (e) =>
    value = e.target.value
    alphanumeric = Keyboarding.isAlphanumeric(e.keyCode)
    backspace = Keyboarding.isBackspace(e.keyCode)
    space = Keyboarding.isSpace(e.keyCode)
    enter = Keyboarding.isEnter(e.keyCode)

    if alphanumeric or backspace or space
      @showResults() unless @resultsOpen
      @handleSearch value
      @options.onKeyedUp value
    else if enter and @selectedResult
      @handleSelectedResult()
      @resultsOpen = no
    else if @options.canAddNewRecords and Utils.present(value) and enter
      @input.focus()
      @hideResults()
      @options.onAdd value

  onKeyDown: (e) =>
    backspace = Keyboarding.isBackspace(e.keyCode)
    enter = Keyboarding.isEnter(e.keyCode)

    if Keyboarding.isUpOrDown(e.keyCode)
      e.preventDefault()
      if @domResults.length > 0 # Only handle shortcut if theres results to key up/down through.
        @handleUpOrDown Keyboarding.upAndDownKeys[e.keyCode]

    if Keyboarding.isRightOrTab(e.keyCode)
      selectSuggestion = @options.suggestResult and
                         @input.value and
                         @suggestionElm.dataset.result.length > 0 and
                         @suggestionElm.dataset.result.length > @input.value.length

      if selectSuggestion
        e.preventDefault()
        @selectSuggestedResult Keyboarding.rightAndTabKeys[e.keyCode]

    # Prevents a parent form submitting.
    if enter
      e.preventDefault()

    @options.onKeyedDown e

  onFocus: =>
    @bindEvents()
    if @allResults.length > 0 and @options.suggestResult
      if @resultsAreObjects then topResult = @domResults[0].value else topResult = @domResults[0]
      @handleSuggestion topResult
    @handleSearch @input.value
    @showResults()
    Utils.addClass "focussed", @elm
    @options.onFocussed()

  onBlur: =>
    @unbindEvents()
    @hideResults()
    Utils.removeClass "focussed", @elm
    @options.onBlurred()

  onScroll: (e) =>
    startIndex = Math.round(@resultsWrapperElm.scrollTop / @singleResultHeight)
    endIndex = startIndex + @domCap

    if endIndex <= @options.data.length
      unless startIndex is @previousScrollIndex
        @domResults = @allResults.slice startIndex, endIndex
        @handleResults startIndex
        @handleScroll startIndex
        @addScrollSpace()
        if @manualScroll then @handleActiveState() else @selectedIndex = startIndex
        @manualScroll = no
        @selectedResult = null

      @previousScrollIndex = startIndex

  onMouseDown: (e) =>
    unless e.target is @resultsWrapperElm # Allow mousedown in scrollbar
      resultsPresent = @allResults.length > 0

      if resultsPresent
        @selectedResult = e.target.querySelector "a"
        @selectedIndex = parseInt @selectedResult.dataset.index
        @handleActiveState()
        @handleSelectedResult()

        window.requestAnimationFrame =>
          @input.focus()
          @hideResults()

  # ************************************************************
  # Actions
  # ************************************************************

  handleInitialResults: ->
    # If completeMe has an existing value.
    if @options.selectedValue
      @setSaveValue @options.selectedValue
      @setValue @options.selectedValue
    ###
      If completeMe has an existing value selected by its key name
      i.e [{ key: "1", value: "John Smith" },...]
      selectedKey: "1" would set the value of the input to "John Smith"
    ###
    if @options.selectedKey
      if Utils.present @options.selectedKey
        value = Utils.where("key", @options.selectedKey, @options.data)[0].value
        if @options.saveByValue then @setSaveValue value else @setSaveValue @options.selectedKey
        @setValue value
    else
      startIndex = 0
      @selectedIndex = -1
      @domResults = @allResults.slice startIndex, startIndex + @domCap
      @insertSingleResultWrappers()
      @handleResults startIndex

  setSaveValue: (saveValue) ->
    @elm.dataset.saveValue = saveValue

  handleUpOrDown: (direction) ->
    @previousIndex = @selectedIndex
    if direction is "DOWN" and @selectedIndex + 1 < @allResults.length then @selectedIndex++
    if direction is "UP" and @selectedIndex - 1 > -1 then @selectedIndex--

    unless @selectedIndex is @previousIndex
      selectedResult = @elm.querySelector "a.index-#{@selectedIndex}"

      if selectedResult
        @handleActiveState()
      else if @allResults[@selectedIndex]
        @updateDomResults direction

  handleSearch: (value, searchFromCallback = no) ->
    startIndex = 0
    @handleAllResults value
    resultsPresent = @allResults.length > 0
    @selectedIndex = -1
    @selectedResult = null

    if resultsPresent
      if @allResults.length > @domCap then endIndex = @domCap else endIndex = @allResults.length
      @domResults = @allResults.slice startIndex, endIndex
      @insertSingleResultWrappers()
      @handleResults startIndex
      # Reset results whenever a key thats not up / down is pressed so that it always starts back at the top.
      @resultsWrapperElm.scrollTop = 0
    else
      @domResults = []
      @clearSuggestion() if @options.suggestResult

      unless searchFromCallback
        fetchingMoreResults = @options.onNoResults value

        if fetchingMoreResults
          @handleFetchingResults()
        else
          @handleNoResults value
      else
        @handleNoResults value

  handleAllResults: (value) ->
    if @resultsAreObjects
      @allResults = Utils.findOccurrenceInObject value, @options.data
    else
      @allResults = Utils.findOccurrenceInArray value, @options.data

  handleSelectedResult: ->
    @input.value = @selectedResult.dataset.result
    key = @allResults[@selectedResult.dataset.index]?.key
    if @options.saveByValue then @setSaveValue @input.value else @setSaveValue key
    @options.onSelect @input.value, key
    @hideResults()

  selectSuggestedResult: (key) ->
    @input.value = @suggestionElm.dataset.result

    if @options.saveByValue
      @setSaveValue @input.value
    else
      @options.selectedKey = Utils.where("value", @input.value, @options.data)[0].key
      @setSaveValue @options.selectedKey

    @handleSearch @input.value
    @selectedResult = @resultsElm.querySelector "a.index-0"
    @options.onSuggestionSelected @input.value, key

  handleActiveState: ->
    @selectedResult = @resultsElm.querySelector "a.index-#{@selectedIndex}"
    @removeActiveState()
    Utils.addClass "active", @selectedResult
    @handleSuggestion @selectedResult.dataset.result if @options.suggestResult

  updateDomResults: (direction) ->
    if direction is "DOWN" then startIndex = @selectedIndex - (@domCap - 1)
    if direction is "UP" then startIndex = @selectedIndex
    @manualScroll = yes
    @resultsWrapperElm.scrollTop = @singleResultHeight * startIndex

  updateData: (newData) =>
    @options.data = newData
    @handleSearch @input.value, yes

  setValue: (value) ->
    @input.value = value
    @handleSearch value

  # ************************************************************
  # Templating
  # ************************************************************

  render: (elm, template) ->
    elm.innerHTML = template

  handleTemplate: ->
    # Template related variables
    @containerClass = "cm-container"
    @inputWrapperClass = "cm-input-wrap"
    @resultsWrapperClass = "cm-results-wrap"
    @resultsClass = "cm-results"
    @noResultsClass = "cm-without-results"
    @highlightedMatchClass = "cm-highlight"
    @inputClass = "cm-input"
    @suggestionClass = "cm-suggestion"
    @tabindexSnippet = if @elm.dataset.tabindex then "tabindex=#{@elm.dataset.tabindex}" else ""
    @template = """
                <div class="#{@inputWrapperClass}">
                  <input type="text" class="#{@inputClass}" placeholder="#{@options.placeholder}" #{@tabindexSnippet}>
                  <input type="text" class="#{@suggestionClass}" disabled>
                </div>
                <div class="#{@resultsWrapperClass}">
                  <ul class="#{@resultsClass}"></ul>
                </div>
                """
    @singleResultWrapper = "<li></li>"
    @singleResultContent = """
                          <a href="#" class="index-{{index}}" data-result="{{dataResult}}" data-index="{{dataIndex}}">
                            {{result}}
                          </a>
                          """
    @noResultsContent = """
                        <li class="#{@noResultsClass}">
                          <i>#{@options.noResultsText} "{{searchValue}}"</i>
                          {{canAddNewRecordsSnippet}}
                        </li>
                        """
    @canAddNewRecordsSnippet = "<span>#{@options.canAddNewRecordsText}</span>"
    @fetchingMoreResultsSnippet = "<p>#{@options.fetchingMoreResultsText}</p>"

    @render @elm, @template

    # Now that autocomplete is rendered we can do DOM related things.
    Utils.addClass @containerClass, @elm
    @inputWrap = @elm.querySelector ".#{@inputWrapperClass}"
    @input = @elm.querySelector ".#{@inputWrapperClass} input"
    @suggestionElm = @elm.querySelector ".#{@suggestionClass}"
    @resultsWrapperElm = @elm.querySelector ".#{@resultsWrapperClass}"
    @resultsElm = @elm.querySelector ".#{@resultsClass}"

  insertSingleResultWrappers: ->
    i = 0
    resultWrapperSnippet = ""

    while i < @domResults.length
      resultWrapperSnippet += @singleResultWrapper
      i++

    @render @resultsElm, resultWrapperSnippet
    @addScrollSpace()

  addScrollSpace: ->
    # TODO: store singleResultHeight once per instance, rather then everytime addScrollSpace is called.
    @singleResultHeight = @resultsElm.querySelector("li").getBoundingClientRect().height
    viewportHeight = @singleResultHeight * @domResults.length
    artificialHeight = (@allResults.length * @singleResultHeight) - @resultsWrapperElm.scrollTop
    Utils.addHeight "#{viewportHeight}px", @resultsWrapperElm
    Utils.addHeight "#{artificialHeight}px", @resultsElm

  handleResults: (startIndex) ->
    for result, index in @domResults
      result = result.value if @resultsAreObjects
      if @input.value then domResult = @highlightSearchTerm result else domResult = result

      # TODO: remove the need for class index, and only use data index.
      singleResultsSnippet = @singleResultContent.replace("{{index}}", startIndex + index)
                                                 .replace("{{dataIndex}}", startIndex + index)
                                                 .replace("{{result}}", domResult)
                                                 .replace("{{dataResult}}", result)

      singleResultElm = @resultsElm.querySelectorAll("li")[index]
      @render singleResultElm, singleResultsSnippet

    if @options.suggestResult and @resultsOpen
      ###
        Querying the result attr encodes HTML entities for free (the DOM does it for us).
        For example if the result contains &amp; the suggestion renders &.
      ###
      topResult = @resultsElm.querySelector("a").dataset.result
      @handleSuggestion topResult

  highlightSearchTerm: (result) ->
    Utils.highlightCharacterInString @input.value, result, @highlightedMatchClass

  handleSuggestion: (result) ->
    @clearSuggestion()

    if @input.value
      # Should only show suggestion if input value is the first part of the top result, otherwise hide suggestion.
      resultBeginsWithValue = result.toLowerCase().indexOf(@input.value.toLowerCase()) is 0
      @showSuggestion result if resultBeginsWithValue

  showSuggestion: (result) ->
    suggestion = @input.value + result.substring @input.value.length
    @suggestionElm.value = suggestion
    @suggestionElm.dataset.result = result
    @options.onShowSuggestion suggestion

  clearSuggestion: ->
    @suggestionElm.value = ""
    @suggestionElm.dataset.result = ""
    @options.onClearSuggestion()

  handleScroll: (startIndex) ->
    @resultsElm.style.transform = "translate(0px, #{startIndex * @singleResultHeight}px)"
    @resultsElm.style.webkitTransform = "translate(0px, #{startIndex * @singleResultHeight}px)"

  handleFetchingResults: ->
    @render @resultsElm, @fetchingMoreResultsSnippet

  handleNoResults: (searchValue) ->
    if @options.canAddNewRecords then canAddNewRecordsSnippet = @canAddNewRecordsSnippet else canAddNewRecordsSnippet = ""
    noResultsSnippet = @noResultsContent.replace("{{searchValue}}", searchValue)
                                        .replace("{{canAddNewRecordsSnippet}}", canAddNewRecordsSnippet)

    @render @resultsElm, noResultsSnippet
    Utils.addHeight "auto", @resultsWrapperElm
    Utils.addHeight "auto", @resultsElm

  showResults: ->
    @resultsOpen = yes
    Utils.addClass "results-showing", @elm

  hideResults: ->
    @resultsOpen = no
    @clearSuggestion() if @options.suggestResult
    Utils.removeClass "results-showing", @elm

  removeActiveState: ->
    activeResultElm = @resultsElm.querySelector ".#{@resultsClass} a.active"

    if activeResultElm
      Utils.removeClass "active", activeResultElm

window.CompleteMe = CompleteMe

Utils =
  extend: (target, objects...) ->
    for object in objects
      target[key] = val for key, val of object

    target

  where: (key, value, array) ->
    results = []

    array.filter (object) ->
      if typeof object is "object"
        results.push object if object[key] == value
      else
        results.push object if object == value

    if results.length > 0
      results

  addClass: (className, elm) ->
    elm.classList.add className

  removeClass: (className, elm) ->
    elm.classList.remove className

  addHeight: (height, elm) ->
    elm.style.height = height

  findOccurrenceInArray: (value, array) ->
    results = []
    value = value.toLowerCase()

    for string, index in array
      if string.toLowerCase().indexOf(value) > -1
        results.push string

    results

  findOccurrenceInObject: (value, array) ->
    results = []
    value = value.toLowerCase()

    for object, index in array
      if object.value.toLowerCase().indexOf(value) > -1
        results.push object

    results

  highlightCharacterInString: (match, string, highLightClass) ->
    regex = new RegExp "(" + match + ")", "gi"
    string.replace regex, "<span class=#{highLightClass}>$1</span>"

  present: (thing) ->
    if typeof thing is "string"
      result = thing.length > 0
    if typeof thing is "number"
      result = yes

    result

  # From: http://stackoverflow.com/questions/27078285/simple-throttle-in-js
  throttle: (func, wait, options) ->
    context = undefined
    args = undefined
    result = undefined
    timeout = null
    previous = 0
    if !options
      options = {}

    later = ->
      previous = if options.leading == false then 0 else Date.now()
      timeout = null
      result = func.apply(context, args)
      if !timeout
        context = args = null
      return

    ->
      now = Date.now()
      if !previous and options.leading == false
        previous = now
      remaining = wait - (now - previous)
      context = this
      args = arguments
      if remaining <= 0 or remaining > wait
        if timeout
          clearTimeout timeout
          timeout = null
        previous = now
        result = func.apply(context, args)
        if !timeout
          context = args = null
      else if !timeout and options.trailing != false
        timeout = setTimeout(later, remaining)
      result

Keyboarding =
  alphanumericKeys:
    48: "0"
    49: "1"
    50: "2"
    51: "3"
    52: "4"
    53: "5"
    54: "6"
    55: "7"
    56: "8"
    57: "9"
    96: "0"
    97: "1"
    98: "2"
    99: "3"
    100: "4"
    101: "5"
    102: "6"
    103: "7"
    104: "8"
    105: "9"
    65: "a"
    66: "b"
    67: "c"
    68: "d"
    69: "e"
    70: "f"
    71: "g"
    72: "h"
    73: "i"
    74: "j"
    75: "k"
    76: "l"
    77: "m"
    78: "n"
    79: "o"
    80: "p"
    81: "q"
    82: "r"
    83: "s"
    84: "t"
    85: "u"
    86: "v"
    87: "w"
    88: "x"
    89: "y"
    90: "z"

  upAndDownKeys:
    38: "UP"
    40: "DOWN"

  rightAndTabKeys:
    39: "RIGHT"
    9: "TAB"

  isAlphanumeric: (keyCode) ->
    if @alphanumericKeys[keyCode] then yes else no

  isUpOrDown: (keyCode) ->
    if @upAndDownKeys[keyCode] then yes else no

  isRightOrTab: (keyCode) ->
    if @rightAndTabKeys[keyCode] then yes else no

  isBackspace: (keyCode) ->
    if keyCode is 8 then yes else no

  isEnter: (keyCode) ->
    if keyCode is 13 then yes else no

  isSpace: (keyCode) ->
    if keyCode is 32 then yes else no

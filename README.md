# Complete-Me

Complete Me is a JavaScript library for **autocompletes**. It can **suggest results** (rather like Google search). And is **DOM friendly** - a maximum of 10 results are rendered in the DOM at once.

- [Getting Started](#getting-started)
  - [Demo](#demo)
  - [Supported Browsers](#supported-browsers)
  - [Dependencies](#dependencies)
  - [To Run](#to-run)
  - [To Use](#to-use)
- [Configuration](#configuration)
  - [data](#data)
  - [placeholder](#placeholder)
  - [selectedValue](#selectedvalue)
  - [selectedKey](#selectedkey)
  - [noResultsText](#noresultstext)
  - [canAddNewRecords](#canaddnewrecords)
  - [canAddNewRecordsText](#canaddnewrecordstext)
  - [fetchingMoreResultsText](#fetchingmoreresultstext)
  - [suggestResult](#suggestresult)
  - [saveByValue](#savebyvalue)
- [Callbacks](#callbacks)
  - [onSelect](#onselect)
  - [onAdd](#onadd)
  - [onNoResults](#onnoresults)
  - [onFocussed](#onfocussed)
  - [onBlurred](#onblurred)
  - [onKeyedDown](#onkeyeddown)
  - [onKeyedUp](#onkeyedup)
  - [onShowSuggestion](#onshowsuggestion)
  - [onClearSuggestion](#onclearsuggestion)
  - [onSuggestionSelected](#onsuggestionselected)
  - [updateData](#updatedata)
- [Markup](#markup)
  - [Generated HTML](#generated-html)
  - [Conditional CSS Classes](#conditional-css-classes)
    - [results-showing](#results-showing)
    - [focussed](#focussed)
    - [cm-without-results](#cm-without-results)
  - [Data Attributes](#data-attributes)
    - [data-tabindex](#data-tabindex)
    - [data-save-value](#data-save-value)

## Getting Started

### Demo

A demo of the library in action can be [found here](http://www.callumhart.com/open-source/complete-me).

### Supported Browsers

So far tested on Chrome, Firefox, Safari and Opera.

### Dependencies

Nothing *(not even jQuery)*

### To Run

```
$ git clone git@github.com:callum-hart/Complete-Me.git
$ cd Complete-Me
$ npm install
$ grunt watch
```

### To Use

- Include [CSS](https://github.com/callum-hart/Complete-Me/blob/master/lib/css/complete-me.min.css)
- Include [JavaScript](https://github.com/callum-hart/Complete-Me/blob/master/lib/js/complete-me.min.js)
- Create an instance:

```javascript
var instance = new CompleteMe(element, { options });
```

> `element` can be a selector or a DOM element.

## Configuration

### data

- **Details**
  - Data that should show in the results dropdown.
- **Type** `Array <String> | <Object>`
- **Required** Yes
- **Condition**
  - When array type is object, attributes are *key* and *value*: `[{"key": "", "value": ""}]`

### placeholder

- **Details**
  - Placeholder text
- **Type** `String`
- **Default** `Type here…`

### selectedValue

- **Details**
  - Select an existing result by its value.
- **Type** `String`

### selectedKey

- **Details**
  - Select an existing result by its key.
- **Type** `String`

### noResultsText

- **Details**
  - Text to show when there are no results.
- **Type** `String`
- **Default** `Couldn't find [input value]`

### canAddNewRecords

- **Details**
  - Allow new records to be added to the list.
- **Type** `Boolean`
- **Default** `false`

### canAddNewRecordsText

- **Details**
  - Text / DOM element to show when there are no results.
- **Type** `String`
- **Default** `Hit <span class="cm-key">enter</span> to add`
- **Condition**
  - Option [`canAddNewRecords`](#canaddnewrecords) has to be set to `true`.

### fetchingMoreResultsText

- **Details**
  - Text to show when remote data is being fetched.
- **Type** `String`
- **Default** `Fetching more results...`
- **Condition**
  - Callback [onNoResults](#onnoresults) has to be present on initialization.

### suggestResult

- **Details**
  - Show suggestion in placeholder.
- **Type** `Boolean`
- **Default** `false`

### saveByValue

- **Details**
  - Specify what the data attribute [`data-save-value`](#data-save-value) should use.
- **Type** `Boolean`
- **Default** `true`
- **Condition**
  - When `true` (and data contains objects) [`data-save-value`](#data-save-value) uses the attribute `value`.
  - When `false` (and data contains objects) [`data-save-value`](#data-save-value) uses the attribute `key`.

## Callbacks

### onSelect
`onSelect: (value) {}`

- **Details**
  - When a record in the results dropdown is selected.
- **Arguments** `(value)` | `(value, key)`
- **Condition**
  - When data contains objects the object key is passed as the second parameter.

### onAdd
`onAdd: (newRecord) {}`

- **Details**
  - When a new record is added to the list.
- **Arguments** `(newRecord)`
- **Condition**
  - Option [`canAddNewRecords`](#canaddnewrecords) has to be set to `true`.

### onNoResults
`onNoResults: (value) {}`

- **Details**
  - When the input value isn’t found in data.
- **Arguments** `(value)`

### onFocussed
`onFocussed: {}`

- **Details**
  - When `focus` event is fired on complete me input.

### onBlurred
`onBlurred: {}`

- **Details**
  - When `blur` event is fired on complete me input.

### onKeyedDown
`onKeyedDown: {}`

- **Details**
  - When `keydown` event is fired on complete me input.

### onKeyedUp
`onKeyedUp: {}`

- **Details**
  - When `keyup` event is fired on complete me input.

### onShowSuggestion
`onShowSuggestion: {}`

- **Details**
  - When a suggested result is shown.
- **Condition**
  - Option [suggestResult](#suggestresult) has to be set to `true`.

### onClearSuggestion
`onClearSuggestion: {}`

- **Details**
  - When a suggested result is hidden.
- **Condition**
  - Option [suggestResult](#suggestresult) has to be set to `true`.

### onSuggestionSelected
`onSuggestionSelected: (value) {}`

- **Details**
  - When a suggested result is selected.
- **Condition**
  - Option [suggestResult](#suggestresult) has to be set to `true`.

### updateData
`updateData: (newData) {}`

- **Details**
  - Update the data in the list.
- **Arguments** `(newData)`

## Markup

### Generated HTML

The HTML generated by complete me is:

```html
<div class="cm-container">
  <div class="cm-input-wrap">
    <input type="text" class="cm-input">
    <input type="text" class="cm-suggestion">
  </div>
  <div class="cm-results-wrap">
    <ul class="cm-results">
      <li><a href="#"></a></li>
    </ul>
  </div>
</div>
```

### Conditional CSS Classes

Classes that are applied when a certain condition is true.

#### results-showing
`.results-showing`

- **Condition**
  - Applied when complete me dropdown list is showing.
- **Element**
  - Applied to `.cm-container`

#### focussed
`.focussed`

- **Condition**
  - Applied when complete me input is focussed.
- **Element**
  - Applied to `.cm-container`

#### cm-without-results
`.cm-without-results`

- **Condition**
  - Applied when there aren’t any results for the given search query.
- **Element**
  - Applied to `.cm-container .cm-results-wrap .cm-results li`

#### cm-highlight
`.cm-highlight`

- **Condition**
  - Applied to the text matching the search query.
- **Element**
  - Applied to `.cm-container .cm-results-wrap .cm-results a span`

### Data Attributes

#### data-tabindex
`data-tabindex`

- **Details**
  - Set the tabindex for the input.
- **Element**
  - Applied to `.cm-container`

#### data-save-value
`data-save-value`

- **Details**
  - Get the value of the input. *This is handled internally by complete me.*
- **Element**
  - Applied to `.cm-container`
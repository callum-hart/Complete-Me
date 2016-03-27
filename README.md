# Complete-Me
Performant javascript autocomplete
---

- Performant - maximum of 10 DOM elements in results list. DOM elements are recycled on scroll and key up/down.
- Suggests results.

### Dependencies

- Nothing

### To initialise

```javascript
var instance = new CompleteMe(element, { options });
```

> `element` can be a selector or a DOM element.

### Configuration options

- `data` Data that should show in the results dropdown, can be:
  - Empty array i.e `[]` *TODO just set data to an empty array in defaultOptions.*
  - Flat array i.e `[“a”, “b”, “c”]`
  - Array of objects i.e `[{“key”: “id”, “value”: “ID”}, {“key”: “email_address”, “value” : “Email Address”}]`
- `placeholder` Placeholder text, *default* `Type here…`, *type* Array
- `selectedValue` Select an existing result by its value, *type* String
- `selectedKey` Select an existing result by its key, *type* String
- `noResultsText` Text to show when there are no results., *default* `Couldn't find {{searchQuery}}`, *type* String
- `canAddNewRecords` Allow new records to be added to the list., *default* `False`, *type* Boolean
- `canAddNewRecordsText` Text / DOM element to show when there are no results.`canAddNewRecords` option has to be True., *default* `Hit <span class="cm-key">enter</span> to add`, *type* String
- `fetchingMoreResultsText` Text to show when remote data is being fetched – only shows when `onNoResults` callback is used., *default* `Fetching more results...`, *type* String
- `suggestResult` Show suggestion in placeholder, *default* `False`, *type* Boolean
- `saveByValue` When data is an array of objects set data-save-value to the selected object’s value attribute. When False data-save-value is set to the selected objects key attribute., *default* `True`, *type* Boolean

### Callbacks

- `onSelect: (value)` When a record in the results dropdown is selected. If data is array of objects then @params are `(value, key)`
- `onAdd: (newRecord)` When a new record is added to the list. `canAddNewRecords` option has to be True.
- `onNoResults: (value)` When the search query isn’t found in the data array.
- `onFocussed` When “focus” event is fired (within autocomplete).
- `onBlurred` When “blur” event is fired (within autocomplete).
- `onKeyedDown` When “keydown” event is fired (within autocomplete).
- `onKeyedUp` When “keydown” event is fired (within autocomplete).
- `onShowSuggestion` When suggestion is shown. `suggestSuggestion` option has to be True.
- `onClearSuggestion` When suggestion is hidden. `suggestSuggestion` option has to be True.
- `onSuggestionSelected: (value)` When user accepts suggestion. `suggestSuggestion` option has to be True.
- `updateData: (value)` Update the data that displays in the dropdown.

### Data attributes

- `data-tabindex` Set the tabindex for the slab input, *element* `.cm-container`
- `data-save-value` The value of the complete me; useful when a form is submitted and you need to get the value of the input., *element* `.cm-container`

### Markup

The HTML generated by CompleteMe is:

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

### Stateful classes

- `.results-showing` applied when search results dropdown is showing, *element* `.cm-container`
- `.focussed` applied when the complete me input is focussed, *element* `.cm-container`
- `.cm-without-results` applied when there aren’t any results for the given search query, *element* `li` in `.cm-results`

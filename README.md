# Actor - Kickstarter location to places

To query kickstarter by location you need to know the ID of the location, this Actor takes
as an input a name of a location (eq. "Prague"), queries Kickstarter's places json endpoint and
output's a list of up to 10 found locations with their ID's. It also stores additional details about found locations
in a json file called OUTPUT in Key Value store.

## INPUT

Input of this actor should be JSON containing a single property called `query` with a string value
representing the location.

For example:
```json
{
    "query": "Prague"
}
```

## Run & Console output
While the Actor is running it will output either error message or the list of the found location.
If the Actor fails with an error, then the error is immediately outputed and the process is ended.

## OUTPUT

When the Actor finishes it will create and `OUTPUT` file containing the additional details about each found location:

The structure of this output is:
```
locations - Array
    - 0 - Object
        - id - Number
        - name - String
        - slug - String
        - short_name - String
        - displayable_name - String
        - localized_name - String
        - country - String
        - state - String
        - type - String
        - is_root - Boolean
        - urls - Object
    - ...
total_hits - Number
```

# PlaneCode 2.8.0

Status: CURRENT

Each SPL Set is a first-class system object with three peer properties:

- `Name`
- `Version`
- `Data`

Current example metadata:

- SetLang: Name `модель`, Version `1`
- SetData: Name `данные`, Version `1`
- SetRender: Name `сцена`, Version `1`

`Data` contains the payload of the Set. `Name` and `Version` are Set metadata, not payload fields.

SetLang object properties are direct properties of PLang entities. The former `Visual` wrapper is removed and forbidden.

---
'@wso2/oxygen-ui': minor
---

Load MUI X Data Grid only when `ListingTable.DataGrid` mounts. An app that uses only the plain table of `ListingTable` no longer ships Data Grid in its initial bundle, and an app that uses the Data Grid part needs no new import. The Data Grid part now renders after an asynchronous load: it shows a loading state while the load is pending and an error state if it fails, and the next mount tries again after a failure. An app's test that expects grid rows on the first render has to wait for them.

# Firebase Indexes Required

The following Firestore indexes need to be created manually in the Firebase Console:

## Stream Requests Indexes

### Index 1: For loadStreamRequests()
- **Collection**: streamRequests
- **Fields**:
  - hostId (Ascending)
  - requestedAt (Descending)
- **Query Type**: Collection Group
- **Scope**: Collection

### Index 2: For loadApprovedStreams()  
- **Collection**: streamRequests
- **Fields**:
  - hostId (Ascending)
  - status (Ascending) 
  - scheduledTime (Descending)
- **Query Type**: Collection Group
- **Scope**: Collection

## How to Create Indexes

1. Go to Firebase Console: https://console.firebase.google.com/project/kiuma-mob-app/firestore
2. Click on "Indexes" tab
3. Click "Create Index"
4. For each index above:
   - Select "streamRequests" collection
   - Add the fields in the specified order
   - Set the correct sort order (Ascending/Descending)
   - Click "Create Index"

## Alternative: Auto-Create Links

Firebase provides auto-create links in the error messages. Click these links to create indexes automatically:

- For loadStreamRequests: https://console.firebase.google.com/v1/r/project/kiuma-mob-app/firestore/indexes?create_composite=ClRwcm9qZWN0cy9raXVtYS1tb2ItYXBwL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9zdHJlYW1SZXF1ZXN0cy9pbmRleGVzL18QARoKCgZob3N0SWQQARoPCgtyZXF1ZXN0ZWRBdBACGgwKCF9fbmFtZV9fEAI

- For loadApprovedStreams: https://console.firebase.google.com/v1/r/project/kiuma-mob-app/firestore/indexes?create_composite=ClRwcm9qZWN0cy9raXVtYS1tb2ItYXBwL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9zdHJlYW1SZXF1ZXN0cy9pbmRleGVzL18QARoKCgZob3N0SWQQARoKCgZzdGF0dXMQARoRCg1zY2hlZHVsZWRUaW1lEAIaDAoIX19uYW1lX18QAg

## Notes

- Index creation takes a few minutes to complete
- Until indexes are created, the queries will fail with "requires an index" errors
- Once created, the stream request loading should work properly

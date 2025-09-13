## Thank you for your hard work !
## It's pleasure working with you .

### RBAC Permissions

The backend seeds a basic set of permissions and exposes `/me` for the
currently authenticated user. To run the backend:

```bash
cd backend
go run main.go
```

The frontend loads the current user and permissions on login and provides a
"Refresh Permissions" option in the sidebar to pull the latest permission set
without logging out.

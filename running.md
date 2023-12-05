### Running the dashboard

- kubectl apply -f dashboard-adminuser.yml
- kubectl apply -f dashboard-role.yml

Then

- kubectl -n kubernetes-dashboard create token admin-user

Then, copy the token to access the dashboard

- kubectl proxy //to "start" the dashboard
- Copy the url from the terminal and browse to it.




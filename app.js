const express = require("express");

const path = require("path");

const dotenv = require("dotenv");

const { router: dbRouter } = require("./db.js");

require("dotenv").config();

const app = express();

const signupmodule = require("./auth/signup.js");

const loginmodule = require("./auth/login.js");

const passport = require("passport");
const oauthmodule = require("./auth/OAuth/googleoauth.js");
require("./auth/OAuth/passport.js");

require("./auth/authorisation.js");

app.use("/uploads", express.static("uploads"));

const createProfileModule = require("./apis/accountManagent/createProfile.js");
const updateProfileModule = require("./apis/accountManagent/updateProfile.js");
const deleteAccountModule = require("./apis/accountManagent/deleteAccount.js");
const changePasswordModule = require("./apis/accountManagent/changePassword.js");
const verifyModule = require("./apis/accountManagent/verify.js");

const deleteApplicationModule = require("./apis/applicationManagement/deleteApplication.js");
const updateApplicationModule = require("./apis/applicationManagement/updateApplication.js");
const uploadApplicationModule = require("./apis/applicationManagement/uploadApplication.js");
const viewApplicationModule = require("./apis/applicationManagement/viewApplication.js");

const createPostsModule = require("./apis/posts/createPost.js");
const viewPostModule = require("./apis/posts/viewPost.js");
const updatePostModule = require("./apis/posts/updatePost.js");
const deletePostModule = require("./apis/posts/deletePost.js");
const savePostModule = require("./apis/posts/savePost.js");

const viewJobModule = require("./apis/jobManagement/viewJob.js");
const manageJobModule = require("./apis/jobManagement/manageJob.js");
const jobApplyModule = require("./apis/jobManagement/jobApply.js");

const notificationModule = require("./apis/notification.js");

const applicationManagementModule = require("./apis/admin/applicationManagement.js");
const jobManagementModule = require("./apis/admin/jobManagement.js");
const viewUsersModule = require("./apis/admin/userManagement/viewUsers.js");
const manageUserModule = require("./apis/admin/userManagement/manageUsers.js");

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/db", dbRouter);

app.use("/signup", signupmodule);

app.use("/login", loginmodule);

app.use("/oauth", oauthmodule);
app.use(passport.initialize());

app.use("/account", createProfileModule);
app.use("/account", updateProfileModule);
app.use("/account", changePasswordModule);
app.use("/account", deleteAccountModule);
app.use("/account", verifyModule);

app.use("/applications", deleteApplicationModule);
app.use("/applications", updateApplicationModule);
app.use("/applications", uploadApplicationModule);
app.use("/applications", viewApplicationModule);

app.use("/posts", createPostsModule);
app.use("/posts", viewPostModule);
app.use("/posts", updatePostModule);
app.use("/posts", deletePostModule);

app.use("/savedPosts", savePostModule);

app.use("/jobs", viewJobModule);
app.use("/jobs", manageJobModule);
app.use("/jobs", jobApplyModule);

app.use("/notifications", notificationModule);

app.use("/admin", applicationManagementModule);
app.use("/admin", jobManagementModule);
app.use("/admin", manageUserModule);
app.use("/admin", viewUsersModule); 

app.get("/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "googlelogin.html"));
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "success.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
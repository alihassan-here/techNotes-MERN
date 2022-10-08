const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const verfiyJWT = require("../middleware/verifyJWT");


router.use(verfiyJWT);


router.route('/')
    .get(getAllUsers)
    .post(createUser)
    .patch(updateUser)
    .delete(deleteUser);


module.exports = router;
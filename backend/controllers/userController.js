const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");


// @desc    Get all users
// @route   GET /users
// @access  Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-password").lean();
    if (!users?.length) {
        return res.status(400).json({ message: "No users found" });
    }
    res.status(200).json(users);
});

// @desc    Create new user
// @route   POST /users
// @access  Private
const createUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;
    //CONFIRM DATA
    if (!username || !password || !Array.isArray(roles) || !roles?.length) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }
    //CHECK IF USER EXISTS
    const userExists = await User.findOne({ username }).lean().exec();
    if (userExists) {
        return res.status(409).json({
            message: "User already exists"
        });
    }

    //HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //CREATE USER
    const userObject = {
        username,
        password: hashedPassword,
        roles
    };
    const user = await User.create(userObject);
    if (!user) {
        return res.status(400).json({
            message: "User could not be created"
        });
    }
    res.status(201).json({
        message: `New user ${username} created`
    });

});

// @desc    Update a user
// @route   PATCH /users
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body;

    //CONFIRM DATA
    if (!id || !username || !Array.isArray(roles) || !roles.length || !typeof active === "boolean") {
        return res.status(400).json({
            message: "All fields are required"
        });
    }
    //CHECK IF USER EXISTS
    const userExists = await User.findById(id).exec();
    if (!userExists) {
        return res.status(409).json({
            message: "User does not exist"
        });
    }
    //CHECK FOR DUPLICATE
    const duplicate = await User.findOne({ username }).exec();
    if (duplicate && duplicate._id.toString() !== id) {
        return res.status(409).json({
            message: "Username already taken"
        });
    }

    userExists.username = username;
    userExists.roles = roles;
    userExists.active = active;
    if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        userExists.password = hashedPassword;
    }
    const updatedUser = await userExists.save();
    if (!updatedUser) {
        return res.status(400).json({
            message: "User could not be updated"
        });
    }
    res.status(200).json({
        message: `User ${username} updated`
    });


});

// @desc    Delete a user
// @route   DELETE /users
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;
    //CONFIRM DATA
    if (!id) {
        return res.status(400).json({
            message: "User ID required"
        });
    }
    //CHECK IF USER EXISTS
    const userExists = await User.findById(id).exec();
    if (!userExists) {
        return res.status(409).json({
            message: "User does not exist"
        });
    }
    //CHECK IF USER HAS NOTES
    const notes = await Note.find({ user: id }).exec();
    if (notes.length) {
        return res.status(409).json({
            message: "User has notes, cannot delete"
        });
    }
    const deletedUser = await userExists.deleteOne();
    if (!deletedUser) {
        return res.status(400).json({
            message: "User could not be deleted"
        });
    }
    res.status(200).json({
        message: `User ${userExists.username} deleted`
    });

});


module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
};

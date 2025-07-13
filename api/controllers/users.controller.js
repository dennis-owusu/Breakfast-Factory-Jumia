import Users from "../models/users.model.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const createUser = async(req, res, next) => {
  const { name, email, password, phoneNumber, storeName, profilePicture, usersRole } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Users({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      storeName,
      profilePicture,
      usersRole: usersRole || 'user'
    });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
}

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.usersRole },
      process.env.JWT_SECRET
    );
    res
      .status(200)
      .cookie('access_token', token, {
        httpOnly: true,
      })
      .json(user);
  } catch (error) {
    next(error);
  } 
}

export const google = async (req, res, next) => {
    const { email, name, password, phoneNumber, profilePicture, usersRole } = req.body;
    try {
      const user = await Users.findOne({ email });
      if (user) {
        const token = jwt.sign(
          { id: user._id, role: user.usersRole },
          process.env.JWT_SECRET
        );
        res
          .status(200)
          .cookie('access_token', token, {
            httpOnly: true,
          })
          .json(user);
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new Users({
          name,
          email,
          password: hashedPassword,
          phoneNumber,
          profilePicture,
          usersRole: usersRole || 'user' // Default role if not specified
        });
        await newUser.save();
        const token = jwt.sign( 
          { id: newUser._id, role: newUser.usersRole },
          process.env.JWT_SECRET
        );
        res
          .status(200)
          .cookie('access_token', token, {
            httpOnly: true,
          })
          .json(newUser);
      }
    } catch (error) {
      next(error);  
    }
  };

export const allClients = async (req, res, next) => {
    try {
        // Verify if requester has admin role
        const token = req.cookies.access_token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        const allUsers = await Users.find().select('-password');
        res.status(200).json({allUsers});
    } catch (error) {
        next(error);
    }  
};

export const updateClient = async (req, res, next) => {
    try {
        const token = req.cookies.access_token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Only allow users to update their own profile or admin to update any profile
        if (decoded.role !== 'admin' && decoded.id !== req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const updateData = {
            name: req.body.name,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            profilePicture: req.body.profilePicture
        };

        // Only admin can update roles
        if (decoded.role === 'admin' && req.body.usersRole) {
            updateData.usersRole = req.body.usersRole;
        }

        // If password is being updated
        if (req.body.password) {
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }

        const updatedUsers = await Users.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        res.status(200).json(updatedUsers);
    } catch (error) {
        next(error);
    }
};
  
export const logout = (req, res, next) => {
    try {
        res
            .clearCookie('access_token')
            .status(200)
            .json('User has been signed out');
    } catch (error) {
        next(error);
    }
};

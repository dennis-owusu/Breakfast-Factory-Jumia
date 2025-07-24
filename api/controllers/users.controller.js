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
    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }
    // Update last login time
    user.lastLogin = new Date();
    await user.save();

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
        if (user.status === 'inactive') {
          return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
        }
        // Update last login time
        user.lastLogin = new Date();
        await user.save();

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
          usersRole: usersRole || 'user', // Default role if not specified
          lastLogin: new Date() // Set initial login time
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
        const { search, role, status, page = 1, limit = 10, id } = req.query;
        const query = {};

        // If specific user ID is requested
        if (id) {
            query._id = id;
        }

        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (role && role !== 'all') {
            query.usersRole = role;
        }

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            Users.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Users.countDocuments(query)
        ]);

        res.status(200).json({
            allUsers: users,
            pagination: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
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

        const updateData = {};

        // Update basic info if provided
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.phoneNumber) updateData.phoneNumber = req.body.phoneNumber;
        if (req.body.profilePicture) updateData.profilePicture = req.body.profilePicture;
        if (req.body.status) updateData.status = req.body.status;

        // Only admin can update roles
        if (decoded.role === 'admin' && req.body.usersRole) {
            // Prevent changing the last admin's role
            if (req.body.usersRole !== 'admin') {
                const currentUser = await Users.findById(req.params.id);
                if (currentUser.usersRole === 'admin') {
                    const adminCount = await Users.countDocuments({ usersRole: 'admin' });
                    if (adminCount <= 1) {
                        return res.status(400).json({ 
                            message: 'Cannot change the role of the last admin user' 
                        });
                    }
                }
            }
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

        if (!updatedUsers) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUsers);
    } catch (error) {
        next(error);
    }
};
  
export const deleteUser = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userToDelete = await Users.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToDelete.usersRole === 'admin') {
      const adminCount = await Users.countDocuments({ usersRole: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await Users.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
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

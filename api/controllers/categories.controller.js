import Categories from "../models/categories.model.js";

export const category = async(req, res, next) => {
    const {categoryName, description, featured, outlet, parent, status } = req.body;

    try {
        const parentValue = parent && parent !== '' ? parent : null;
        const newCategory = new Categories({ 
            categoryName,
            description,
            featured,
            outlet,
            parent: parentValue,
            status
        });
        await newCategory.save(); 
        res.json(newCategory);
        
    } catch (error) {
        next(error);
        console.log(error)
    }
};

export const fetchCategory = async(req, res, next) =>{
    try {
        const allCategory = await Categories.find().populate('parent', 'categoryName');
        res.json({allCategory});
    } catch (error) {
        next(error);
    }
};

export const getCategoryById = async(req, res, next) => {
    try {
        const category = await Categories.findById(req.params.id).populate('parent', 'categoryName');
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.json(category);
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    // Check for subcategories
    const subcategories = await Categories.countDocuments({ parent: categoryId });
    if (subcategories > 0) {
      return res.status(400).json({ message: 'Cannot delete category with subcategories' });
    }

    const deletedCategory = await Categories.findByIdAndDelete(categoryId);
    
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
 
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error); 
    next(error);
  }
};


export const updateCategory = async (req, res, next) => {
      
    try {
      const updateData = {
        categoryName: req.body.categoryName,
        description: req.body.description,
        featured: req.body.featured,
        status: req.body.status
      };
      
      if (req.body.slug) updateData.slug = req.body.slug;
      if (req.body.parent && req.body.parent !== '') {
        updateData.parent = req.body.parent;
      } else if (req.body.parent === '') {
        updateData.parent = null;
      }
      
      const updatedCategory = await Categories.findByIdAndUpdate(
        req.params.id, 
        { $set: updateData },
        { new: true }
      );
      
      if (!updatedCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.status(200).json(updatedCategory);
    } catch (error) {
      next(error);
    }
  };
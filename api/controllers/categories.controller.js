import Categories from "../models/categories.model.js";

export const category = async(req, res, next) => {
    const {categoryName, description, featured, outlet } = req.body;

    try {
        const newCategory = new Categories({ 
            categoryName,
            description,
            featured,
            outlet
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
        const allCategory = await Categories.find();
        res.json({allCategory});
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const deletedCategory = await Categories.findByIdAndDelete(req.params.id);
    
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
      const updatedCategory = await Categories.findByIdAndUpdate(
        req.params.id, 
        {
          $set: {
            categoryName: req.body.categoryName,
            description: req.body.description,
          },
        },
        { new: true }
      );
      res.status(200).json(updatedCategory);
    } catch (error) {
      next(error);
    }
  };
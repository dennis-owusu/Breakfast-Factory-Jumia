import Categories from "../models/categories.model.js";
import {v4 as uuidv4} from 'uuid'

export const category = async(req, res, next) => {
    const {categoryName} = req.body;
    try {
        const newCategory = new Categories({ 
            categoryId: uuidv4(),
            categoryName
        })
        await newCategory.save() 
        res.json(newCategory)
    } catch (error) {
        next(error)
    }   
    
}  

export const fetchCategory = async(req, res, next) =>{
    try {
        const allCategory = await Categories.find({})
        res.json({allCategory})
    } catch (error) {
        next(error)
    }
}

export const deleteCategory = async(req, res, next) => {
    try {
        const deleteOneCategory = await Categories.findByIdAndDelete(req.params.id)
        res.status(200).json(deleteOneCategory)
    } catch (error) {
        next(error)
    }
}

export const updateCategory = async (req, res, next) => {
      
    try {
      const updatedCategory = await Categories.findByIdAndUpdate(
        req.params.id, 
        {
          $set: {
            categoryId: req.body.categoryId,
            categoryName: req.body.categoryName,
          },
        },
        { new: true }
      );
      res.status(200).json(updatedCategory);
    } catch (error) {
      next(error);
    }
  };
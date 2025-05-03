import React from 'react';


const CategoryCard = ({ name, amount }) => {
    return (
        <div className="category-card">
            <h5 className="category-name">{name}</h5>
            <p className="category-amount">Rs.{parseFloat(amount).toFixed(2)}</p>
        </div>
    );
};

export default CategoryCard;

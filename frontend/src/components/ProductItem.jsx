import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="productRow">
      <div className="productMain">
        <div className="productName">{product.name}</div>
        <div className="productCategory">{product.category}</div>
        <div className="productDescription">{product.description}</div>
        <div className="productPrice">{product.price} руб.</div>
        <div className="productStock">В наличии: {product.stock} шт.</div>
      </div>

      <div className="productActions">
        <button className="btn" onClick={() => onEdit(product)}>
          Редактировать
        </button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}
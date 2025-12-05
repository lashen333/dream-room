-- Add category column to products table
alter table products 
add column category text;

-- Optional: Create an index on category for faster filtering
create index idx_products_category on products(category);

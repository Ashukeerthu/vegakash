import { useState } from 'react';

const ExpenseForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    date: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call backend API here
    console.log(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" onChange={handleChange} />
      <input name="category" placeholder="Category" onChange={handleChange} />
      <input name="amount" type="number" placeholder="Amount" onChange={handleChange} />
      <input name="date" type="date" onChange={handleChange} />
      <textarea name="description" placeholder="Description" onChange={handleChange} />
      <button type="submit">Add Expense</button>
    </form>
  );
};

export default ExpenseForm;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  BookOpen, 
  AlertTriangle, 
  X, 
  Check, 
  Info,
  Calendar,
  Layers,
  BookMarked
} from 'lucide-react';

const BookInventory = () => {
  const { isAdmin, user } = useAuth();
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    published_year: '',
    copies_total: 1,
    cover_image_url: ''
  });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedGenre) queryParams.append('genre', selectedGenre);
      if (availableOnly) queryParams.append('available_only', 'true');
      
      const res = await api.get(`/books?${queryParams.toString()}`);
      setBooks(res.data.books);
      setGenres(res.data.genres);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch library books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, selectedGenre, availableOnly]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      genre: '',
      published_year: '',
      copies_total: 1,
      cover_image_url: ''
    });
    setError('');
  };

  // Add Book
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setActionMsg({ type: '', text: '' });
    try {
      await api.post('/books', formData);
      setActionMsg({ type: 'success', text: `Book "${formData.title}" added successfully.` });
      setIsAddModalOpen(false);
      resetForm();
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add book.');
    }
  };

  // Edit Book modal open
  const openEditModal = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre || '',
      published_year: book.published_year || '',
      copies_total: book.copies_total,
      cover_image_url: book.cover_image_url || ''
    });
    setIsEditModalOpen(true);
  };

  // Edit Book Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionMsg({ type: '', text: '' });
    try {
      await api.put(`/books/${selectedBook.id}`, formData);
      setActionMsg({ type: 'success', text: `Book "${formData.title}" updated successfully.` });
      setIsEditModalOpen(false);
      resetForm();
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update book.');
    }
  };

  // Delete Book
  const handleDelete = async (bookId, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the catalog?`)) return;
    
    setActionMsg({ type: '', text: '' });
    try {
      await api.delete(`/books/${bookId}`);
      setActionMsg({ type: 'success', text: `Book "${title}" deleted successfully.` });
      fetchBooks();
    } catch (err) {
      setActionMsg({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to delete book.' 
      });
    }
  };

  // Borrow Book (Member circulation action)
  const handleBorrow = async (book) => {
    setActionMsg({ type: '', text: '' });
    try {
      const res = await api.post('/circulation/borrow', { book_id: book.id });
      setActionMsg({ type: 'success', text: res.data.message });
      fetchBooks(); // refresh copies available
    } catch (err) {
      setActionMsg({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to borrow book.' 
      });
    }
  };

  // Open Book Detail Modal
  const openDetailModal = (book) => {
    setSelectedBook(book);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Library Catalog</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Browse, search, and manage book inventories</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="btn-primary flex items-center gap-2 self-start md:self-auto text-sm"
          >
            <Plus className="h-5 w-5" />
            Add New Book
          </button>
        )}
      </div>

      {actionMsg.text && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-2 ${
          actionMsg.type === 'success' 
            ? 'bg-accent-500/10 border-accent-500/20 text-accent-600 dark:text-accent-300'
            : 'bg-danger-500/10 border-danger-500/20 text-danger-600 dark:text-danger-400'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
            placeholder="Search by Title, Author, or ISBN..."
          />
        </div>
        
        <div className="w-full md:w-56">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">All Genres</option>
            {genres.map(g => (
              <option key={g} value={g} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{g}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-auto flex items-center gap-2 self-start md:self-auto px-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            <span className="ml-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Available only</span>
          </label>
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => {
            const isAvailable = book.copies_available > 0;
            return (
              <div 
                key={book.id} 
                className="glass-panel p-4 rounded-2xl glass-panel-hover flex flex-col justify-between h-[360px] relative overflow-hidden"
              >
                {/* Book Cover Container */}
                <div 
                  onClick={() => openDetailModal(book)}
                  className="h-44 w-full rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden relative group cursor-pointer"
                >
                  <img 
                    src={book.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'} 
                    alt={book.title} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" /> View Details
                    </span>
                  </div>
                  {/* Genre Badge */}
                  <span className="absolute top-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-900/85 dark:bg-slate-950/80 text-slate-100 dark:text-slate-300 border border-slate-700/50 dark:border-white/5">
                    {book.genre}
                  </span>
                </div>

                {/* Info */}
                <div className="mt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 
                      onClick={() => openDetailModal(book)}
                      className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">by {book.author}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 py-1.5 border-y border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] px-2 rounded-lg">
                    <div className="text-center">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Total</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{book.copies_total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Available</p>
                      <p className={`text-xs font-extrabold ${isAvailable ? 'text-accent-600 dark:text-accent-400' : 'text-danger-600 dark:text-danger-400'}`}>
                        {book.copies_available}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {isAdmin ? (
                    <>
                      <button 
                        onClick={() => openEditModal(book)}
                        className="btn-secondary flex-1 py-2 text-xs flex justify-center items-center gap-1"
                        title="Edit Book Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(book.id, book.title)}
                        className="btn-secondary py-2 px-3 text-xs border-danger-500/20 text-danger-600 dark:text-danger-400 hover:bg-danger-500/5 hover:border-danger-500/30 dark:hover:bg-danger-500/10"
                        title="Delete Book"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleBorrow(book)}
                      disabled={!isAvailable}
                      className={`w-full py-2 rounded-lg text-xs font-semibold flex justify-center items-center gap-1.5 transition-all ${
                        isAvailable 
                          ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-md' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-300 dark:border-white/5'
                      }`}
                    >
                      <BookMarked className="h-4 w-4" />
                      {isAvailable ? 'Borrow Book' : 'Out of Stock'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 glass-panel rounded-2xl">
          <BookOpen className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No books match your filters or search terms.</p>
        </div>
      )}

      {/* --- ADD BOOK MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-dark-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                Add Book to Catalog
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-600 dark:text-danger-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Book Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" placeholder="e.g. The Lord of the Rings" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Author</label>
                  <input type="text" name="author" value={formData.author} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" placeholder="e.g. J.R.R. Tolkien" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">ISBN</label>
                  <input type="text" name="isbn" value={formData.isbn} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" placeholder="e.g. 9780547928227" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Genre</label>
                  <input type="text" name="genre" value={formData.genre} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" placeholder="e.g. Fantasy" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Published Year</label>
                  <input type="number" name="published_year" value={formData.published_year} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" placeholder="e.g. 1954" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Total Copies</label>
                  <input type="number" name="copies_total" value={formData.copies_total} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" min="1" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Cover Image URL</label>
                  <input type="url" name="cover_image_url" value={formData.cover_image_url} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" placeholder="e.g. https://images.unsplash.com/... or blank" />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-slate-200 dark:border-white/5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary py-2 text-xs">Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT BOOK MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-dark-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                Modify Catalog Book
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-600 dark:text-danger-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Book Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Author</label>
                  <input type="text" name="author" value={formData.author} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">ISBN</label>
                  <input type="text" name="isbn" value={formData.isbn} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Genre</label>
                  <input type="text" name="genre" value={formData.genre} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Published Year</label>
                  <input type="number" name="published_year" value={formData.published_year} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Total Copies</label>
                  <input type="number" name="copies_total" value={formData.copies_total} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" min="0" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Cover Image URL</label>
                  <input type="url" name="cover_image_url" value={formData.cover_image_url} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-xl glass-input" />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-slate-200 dark:border-white/5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary py-2 text-xs">Update Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BOOK DETAIL MODAL --- */}
      {isDetailModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-dark-950/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-6 relative">
            <button 
              onClick={() => setIsDetailModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="w-full sm:w-44 h-64 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-lg border border-slate-200 dark:border-white/5">
              <img 
                src={selectedBook.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'} 
                alt={selectedBook.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 flex flex-col justify-between py-1 text-sm">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-primary-500/10 text-primary-600 dark:text-primary-300 border border-primary-500/20">
                  {selectedBook.genre || 'General'}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">{selectedBook.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">by {selectedBook.author}</p>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300 text-xs">
                    <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>Published Year: <strong className="text-slate-800 dark:text-slate-200">{selectedBook.published_year || 'Unknown'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300 text-xs">
                    <Layers className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>ISBN-10/13: <strong className="text-slate-800 dark:text-slate-200">{selectedBook.isbn}</strong></span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-3 rounded-xl mb-4 mt-6 sm:mt-0">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">Total Stock</span>
                    <strong className="text-sm text-slate-800 dark:text-slate-300">{selectedBook.copies_total}</strong>
                  </div>
                  <div className="h-8 border-l border-slate-200 dark:border-white/5"></div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">Available Copies</span>
                    <strong className={`text-sm font-extrabold ${selectedBook.copies_available > 0 ? 'text-accent-600 dark:text-accent-400' : 'text-danger-600 dark:text-danger-400'}`}>
                      {selectedBook.copies_available}
                    </strong>
                  </div>
                </div>

                {!isAdmin && (
                  <button
                    onClick={() => { handleBorrow(selectedBook); setIsDetailModalOpen(false); }}
                    disabled={selectedBook.copies_available <= 0}
                    className={`w-full py-2.5 rounded-xl font-semibold text-xs flex justify-center items-center gap-1.5 transition-all ${
                      selectedBook.copies_available > 0 
                        ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-md' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-300 dark:border-white/5'
                    }`}
                  >
                    <BookMarked className="h-4 w-4" />
                    {selectedBook.copies_available > 0 ? 'Borrow This Book' : 'Out of Stock'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookInventory;

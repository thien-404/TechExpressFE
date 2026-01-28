import React, { useState, useEffect, useCallback, useMemo } from 'react'
import instance from '../../../config/axios';
import { Plus, Pencil, Trash2, Search, ChartBarStacked, Upload, X, ChevronRight, ChevronDown } from 'lucide-react';
import { storage } from '../../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Pagination from '../../../components/common/Pagination';

function CategoryPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', parentCategoryId: null, description: '', imageUrl: '' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);

    // Pagination states
    const [pageNumber, setPageNumber] = useState(0); // 0-based for pagination component
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Expanded categories state
    const [expandedCategories, setExpandedCategories] = useState(new Set());

    const handleFetchingCategories = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                pageNumber: pageNumber + 1, // API uses 1-based
                pageSize: pageSize
            };

            if (searchTerm) {
                params.searchTerm = searchTerm;
            }

            const response = await instance.get('/Category', { params });

            if (response.status === 404) {
                console.log(`fetching categories failed: ${response.message}`);
            }
            const data = response.data?.value || {};
            setCategories(data.items || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.log('fetching categories error:', error);
        } finally {
            setLoading(false);
        }
    }, [pageNumber, pageSize, searchTerm]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            handleFetchingCategories();
        }, 300); // 300ms debounce for search

        return () => clearTimeout(debounceTimer);
    }, [handleFetchingCategories]);

    const handlePageChange = (newPage) => {
        setPageNumber(newPage);
    };

    const handleAddCategory = () => {
        setEditingCategory(null);
        setFormData({ name: '', parentCategoryId: null, description: '', imageUrl: '' });
        setImageFile(null);
        setImagePreview('');
        setShowModal(true);
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, parentCategoryId: category.parentCategoryId, description: category.description, imageUrl: category.imageUrl || '' });
        setImageFile(null);
        setImagePreview(category.imageUrl || '');
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Kích thước ảnh không được vượt quá 5MB');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
        setFormData({ ...formData, imageUrl: '' });
    };

    const uploadImageToFirebase = async (file) => {
        const timestamp = Date.now();
        const fileName = `categories/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
            try {
                await instance.delete(`/Category/${id}`);
                handleFetchingCategories();
            } catch (error) {
                console.log('delete category error:', error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let finalImageUrl = formData.imageUrl;

            if (imageFile) {
                finalImageUrl = await uploadImageToFirebase(imageFile);
            }

            const dataToSubmit = {
                ...formData,
                imageUrl: finalImageUrl || null
            };

            if (editingCategory) {
                await instance.patch(`/Category/update${editingCategory.id}`, dataToSubmit);
            } else {
                console.log(dataToSubmit)
                await instance.post('/Category', dataToSubmit);
                setPageNumber(0); // Go to first page after adding new category
            }
            setShowModal(false);
            handleFetchingCategories();
        } catch (error) {
            console.log('submit category error:', error);
            alert('Có lỗi xảy ra khi lưu danh mục');
        } finally {
            setUploading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPageNumber(0); // Reset to first page when searching
    };

    // Organize categories into hierarchical structure
    const organizedCategories = useMemo(() => {
        const categoryMap = new Map();
        const rootCategories = [];

        // First pass: create a map of all categories
        categories.forEach(cat => {
            categoryMap.set(cat.id, { ...cat, children: [] });
        });

        // Second pass: organize into tree structure
        categories.forEach(cat => {
            if (cat.parentCategoryId) {
                const parent = categoryMap.get(cat.parentCategoryId);
                if (parent) {
                    parent.children.push(categoryMap.get(cat.id));
                } else {
                    rootCategories.push(categoryMap.get(cat.id));
                }
            } else {
                rootCategories.push(categoryMap.get(cat.id));
            }
        });

        return rootCategories;
    }, [categories]);

    // Flatten categories for display with hierarchy info
    const displayCategories = useMemo(() => {
        const flattened = [];

        const flatten = (categories, level = 0) => {
            categories.forEach(cat => {
                flattened.push({ ...cat, level });
                if (cat.children && cat.children.length > 0 && expandedCategories.has(cat.id)) {
                    flatten(cat.children, level + 1);
                }
            });
        };

        flatten(organizedCategories);
        return flattened;
    }, [organizedCategories, expandedCategories]);

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const expandAll = () => {
        const allParentIds = categories
            .filter(cat => categories.some(c => c.parentCategoryId === cat.id))
            .map(cat => cat.id);
        setExpandedCategories(new Set(allParentIds));
    };

    const collapseAll = () => {
        setExpandedCategories(new Set());
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <ChartBarStacked className="text-emerald-600" size={28} />
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Danh mục</h1>
                </div>
                <p className="text-slate-600">Quản lý các danh mục sản phẩm của cửa hàng</p>
            </div>

            {/* Search & Add Button */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={expandAll}
                        className="flex items-center gap-2 px-3 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                        title="Mở rộng tất cả"
                    >
                        <ChevronDown size={16} />
                        Mở rộng
                    </button>
                    <button
                        onClick={collapseAll}
                        className="flex items-center gap-2 px-3 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                        title="Thu gọn tất cả"
                    >
                        <ChevronRight size={16} />
                        Thu gọn
                    </button>
                    <button
                        onClick={handleAddCategory}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                    >
                        <Plus size={18} />
                        Thêm danh mục
                    </button>
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Đang tải...</div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Không có danh mục nào</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Hình ảnh
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Tên danh mục
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Mô tả
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {displayCategories.map((category) => (
                                    <tr key={category.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            {category.imageUrl ? (
                                                <img
                                                    src={category.imageUrl}
                                                    alt={category.name}
                                                    className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                                    <ChartBarStacked className="text-slate-400" size={24} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2" style={{ paddingLeft: `${category.level * 24}px` }}>
                                                {category.children && category.children.length > 0 && (
                                                    <button
                                                        onClick={() => toggleCategory(category.id)}
                                                        className="p-1 hover:bg-slate-200 rounded transition flex-shrink-0"
                                                        title={expandedCategories.has(category.id) ? 'Thu gọn' : 'Mở rộng'}
                                                    >
                                                        {expandedCategories.has(category.id) ? (
                                                            <ChevronDown size={16} className="text-slate-600" />
                                                        ) : (
                                                            <ChevronRight size={16} className="text-slate-600" />
                                                        )}
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    {category.level > 0 && (
                                                        <span className="text-slate-400">└─</span>
                                                    )}
                                                    <span className="font-medium text-slate-800">{category.name}</span>
                                                    {category.children && category.children.length > 0 && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                                                            {category.children.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600 text-sm">
                                                {category.description || 'Không có mô tả'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditCategory(category)}
                                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && categories.length > 0 && (
                    <Pagination
                        pageNumber={pageNumber}
                        pageSize={pageSize}
                        totalItems={totalCount}
                        totalPages={totalPages}
                        loading={loading}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">
                            {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tên danh mục *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Nhập tên danh mục"
                                />
                            </div>
                            <div className='mb-4'>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Danh mục cha (Tuỳ chọn)
                                </label>
                                <select
                                    value={formData.parentCategoryId || null}
                                    onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value || null })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value="">-- Không có danh mục cha --</option>
                                    {categories
                                        .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                                        .map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Mô tả
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Nhập mô tả (tùy chọn)"
                                />
                            </div>
                            <div className='mb-6'>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Hình ảnh (Tuỳ chọn)
                                </label>
                                {imagePreview ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                        <Upload className="text-slate-400 mb-2" size={24} />
                                        <span className="text-sm text-slate-600">Nhấn để tải ảnh lên</span>
                                        <span className="text-xs text-slate-400 mt-1">PNG, JPG tối đa 5MB</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={uploading}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? 'Đang xử lý...' : (editingCategory ? 'Cập nhật' : 'Thêm')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CategoryPage
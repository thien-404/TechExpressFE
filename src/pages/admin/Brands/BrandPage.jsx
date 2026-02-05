import { useState, useEffect, useCallback } from 'react'
import instance from '../../../config/axios';
import { Search, Filter, Bandage, Plus, Pencil, Upload, X } from 'lucide-react';
import { storage } from '../../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Pagination from '../../../components/common/Pagination';
import { toast } from 'sonner';

function BrandPage() {
    // Search states
    const [searchInput, setSearchInput] = useState('');
    const [searchName, setSearchName] = useState('');

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [createdFrom, setCreatedFrom] = useState('');
    const [createdTo, setCreatedTo] = useState('');

    // Data & loading
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination states (0-based internally)
    const [pageNumber, setPageNumber] = useState(0);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formData, setFormData] = useState({ name: '', imageUrl: '' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                PageNumber: pageNumber + 1,
                PageSize: pageSize
            };

            if (searchName) {
                params.SearchName = searchName;
            }

            if (createdFrom) {
                params.CreatedFrom = createdFrom;
            }

            if (createdTo) {
                params.CreatedTo = createdTo;
            }

            const response = await instance.get('/Brand', { params });
            const data = response.data?.value || {};
            setBrands(data.items || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.log('fetching brands error:', error);
            toast.error('Có lỗi xảy ra khi tải thương hiệu');
        } finally {
            setLoading(false);
        }
    }, [pageNumber, pageSize, searchName, createdFrom, createdTo]);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const handlePageChange = (newPage) => {
        setPageNumber(newPage);
    };

    const handleSearch = () => {
        setSearchName(searchInput);
        setPageNumber(0);
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClearFilters = () => {
        setSearchName('');
        setSearchInput('');
        setCreatedFrom('');
        setCreatedTo('');
        setPageNumber(0);
    };

    const hasActiveFilters = searchName || createdFrom || createdTo;

    // Modal handlers
    const handleAddBrand = () => {
        setEditingBrand(null);
        setFormData({ name: '', imageUrl: '' });
        setImageFile(null);
        setImagePreview('');
        setShowModal(true);
    };

    const handleEditBrand = (brand) => {
        setEditingBrand(brand);
        setFormData({ name: brand.name, imageUrl: brand.imageUrl || '' });
        setImageFile(null);
        setImagePreview(brand.imageUrl || '');
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh không được vượt quá 5MB');
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
        const fileName = `brands/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
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
                name: formData.name,
                imageUrl: finalImageUrl || null
            };

            if (editingBrand) {
                await instance.put(`/Brand/${editingBrand.id}`, dataToSubmit);
                toast.success('Cập nhật thương hiệu thành công');
            } else {
                await instance.post('/Brand', dataToSubmit);
                toast.success('Thêm thương hiệu thành công');
                setPageNumber(0);
            }
            setShowModal(false);
            fetchBrands();
        } catch (error) {
            console.log('submit brand error:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu thương hiệu');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Bandage className="text-emerald-600" size={28} />
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Thương hiệu</h1>
                </div>
                <p className="text-slate-600">Quản lý các thương hiệu sản phẩm của cửa hàng</p>
            </div>

            {/* Search & Filters */}
            <div className="space-y-3 mb-6">
                {/* Top row: Search and actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên thương hiệu..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleSearchKeyPress}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium whitespace-nowrap"
                        >
                            Tìm kiếm
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg transition text-sm font-medium ${
                                showFilters || hasActiveFilters
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                            title="Bộ lọc"
                        >
                            <Filter size={16} />
                            Lọc
                            {hasActiveFilters && (
                                <span className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {[createdFrom, createdTo].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleAddBrand}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                        >
                            <Plus size={18} />
                            Thêm thương hiệu
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* CreatedFrom */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Ngày tạo từ
                                </label>
                                <input
                                    type="date"
                                    value={createdFrom}
                                    onChange={(e) => {
                                        setCreatedFrom(e.target.value);
                                        setPageNumber(0);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                />
                            </div>

                            {/* CreatedTo */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Ngày tạo đến
                                </label>
                                <input
                                    type="date"
                                    value={createdTo}
                                    onChange={(e) => {
                                        setCreatedTo(e.target.value);
                                        setPageNumber(0);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                />
                            </div>

                            {/* Clear Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={handleClearFilters}
                                    disabled={!hasActiveFilters}
                                    className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Brands Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Đang tải...</div>
                ) : brands.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Không có thương hiệu nào</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Hình ảnh
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Tên thương hiệu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Cập nhật lần cuối
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {brands.map((brand) => (
                                    <tr key={brand.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            {brand.imageUrl ? (
                                                <img
                                                    src={brand.imageUrl}
                                                    alt={brand.name}
                                                    className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                                    <Bandage className="text-slate-400" size={24} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-800">{brand.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600 text-sm">
                                                {brand.createdAt
                                                    ? new Date(brand.createdAt).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })
                                                    : '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600 text-sm">
                                                {brand.updatedAt
                                                    ? new Date(brand.updatedAt).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })
                                                    : '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {brand.isDeleted ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Đã xoá
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    Đang hoạt động
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditBrand(brand)}
                                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil size={16} />
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
                {!loading && brands.length > 0 && (
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">
                            {editingBrand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tên thương hiệu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Nhập tên thương hiệu"
                                />
                            </div>
                            <div className="mb-6">
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
                                    {uploading ? 'Đang xử lý...' : (editingBrand ? 'Cập nhật' : 'Thêm')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BrandPage

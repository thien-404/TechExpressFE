import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import instance from '../../../config/axios';
import { ArrowLeft, Plus, Pencil, Trash2, ChartBarStacked, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Pagination from '../../../components/common/Pagination';

const ACCEPT_VALUE_TYPES = {
    0: 'Text',
    1: 'Number',
    2: 'Decimal',
    3: 'Bool'
};

const ACCEPT_VALUE_TYPE_OPTIONS = [
    { value: 0, label: 'Text' },
    { value: 1, label: 'Number' },
    { value: 2, label: 'Decimal' },
    { value: 3, label: 'Bool' }
];

function CategoryDetailsPage() {
    const { categoryId } = useParams();
    const navigate = useNavigate();

    // Category state
    const [category, setCategory] = useState(null);
    const [loadingCategory, setLoadingCategory] = useState(true);

    // Spec definitions state
    const [specs, setSpecs] = useState([]);
    const [loadingSpecs, setLoadingSpecs] = useState(false);

    // Modal states
    const [showSpecModal, setShowSpecModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingSpec, setEditingSpec] = useState(null);
    const [specToDelete, setSpecToDelete] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        unit: '',
        acceptValueType: 0,
        description: '',
        isRequired: false
    });
    const [submitting, setSubmitting] = useState(false);

    // Pagination states
    const [pageNumber, setPageNumber] = useState(0);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Fetch category details
    const fetchCategory = useCallback(async () => {
        setLoadingCategory(true);
        try {
            const response = await instance.get(`/Category/${categoryId}`);
            setCategory(response.data?.value || null);
        } catch (error) {
            console.log('fetch category error:', error);
            toast.error('Có lỗi xảy ra khi tải thông tin danh mục');
        } finally {
            setLoadingCategory(false);
        }
    }, [categoryId]);

    // Fetch spec definitions
    const fetchSpecs = useCallback(async () => {
        setLoadingSpecs(true);
        try {
            const params = {
                CategoryId: categoryId,
                Page: pageNumber + 1,
                PageSize: pageSize
            };

            const response = await instance.get(`/SpecDefinition/category/${categoryId}`, { params });
            const data = response.data?.value || {};
            setSpecs(data.items || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.log('fetch specs error:', error);
            toast.error('Có lỗi xảy ra khi tải spec definitions');
        } finally {
            setLoadingSpecs(false);
        }
    }, [categoryId, pageNumber, pageSize]);

    useEffect(() => {
        fetchCategory();
    }, [fetchCategory]);

    useEffect(() => {
        fetchSpecs();
    }, [fetchSpecs]);

    const handlePageChange = (newPage) => {
        setPageNumber(newPage);
    };

    const handleAddSpec = () => {
        setEditingSpec(null);
        setFormData({
            name: '',
            code: '',
            unit: '',
            acceptValueType: 0,
            description: '',
            isRequired: false
        });
        setShowSpecModal(true);
    };

    const handleEditSpec = (spec) => {
        setEditingSpec(spec);
        setFormData({
            name: spec.name || '',
            code: spec.code || '',
            unit: spec.unit || '',
            acceptValueType: spec.acceptValueType,
            description: spec.description || '',
            isRequired: spec.isRequired
        });
        setShowSpecModal(true);
    };

    const handleDeleteSpec = (spec) => {
        setSpecToDelete(spec);
        setShowDeleteModal(true);
    };

    const confirmDeleteSpec = async () => {
        if (!specToDelete) return;

        try {
            await instance.delete(`/SpecDefinition/${specToDelete.id}`);
            toast.success('Xóa spec definition thành công');
            setShowDeleteModal(false);
            setSpecToDelete(null);
            fetchSpecs();
        } catch (error) {
            console.log('delete spec error:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa spec definition');
        }
    };

    const cancelDeleteSpec = () => {
        setShowDeleteModal(false);
        setSpecToDelete(null);
    };

    const handleSubmitSpec = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const dataToSubmit = {
                ...formData,
                categoryId: categoryId
            };

            if (editingSpec) {
                await instance.put(`/SpecDefinition/${editingSpec.id}`, dataToSubmit);
                toast.success('Cập nhật spec definition thành công');
            } else {
                await instance.post('/SpecDefinition', dataToSubmit);
                toast.success('Thêm spec definition thành công');
                setPageNumber(0);
            }

            setShowSpecModal(false);
            fetchSpecs();
        } catch (error) {
            console.log('submit spec error:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu spec definition');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingCategory) {
        return (
            <div className="p-6">
                <div className="text-center text-slate-500">Đang tải...</div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="p-6">
                <div className="text-center text-slate-500">Không tìm thấy danh mục</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/categories')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition"
                >
                    <ArrowLeft size={20} />
                    <span>Quay lại danh sách</span>
                </button>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        {category.imageUrl ? (
                            <img
                                src={category.imageUrl}
                                alt={category.name}
                                className="w-20 h-20 object-cover rounded-lg border-2 border-slate-200"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-slate-200">
                                <ChartBarStacked className="text-slate-400" size={32} />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{category.name}</h1>
                            <p className="text-slate-600 mt-1">{category.description || 'Không có mô tả'}</p>
                            <div className="flex items-center gap-2 mt-2">
                                {category.isDeleted ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Đã xoá
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                        Đang hoạt động
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spec Definitions Section */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="text-emerald-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-800">Định nghĩa kỹ thuật</h2>
                    </div>
                    <button
                        onClick={handleAddSpec}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                    >
                        <Plus size={18} />
                        Thêm Spec
                    </button>
                </div>

                {loadingSpecs ? (
                    <div className="p-8 text-center text-slate-500">Đang tải...</div>
                ) : specs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        Chưa có định nghĩa kỹ thuật nào. Nhấn &quot;Thêm Spec&quot; để thêm mới.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Tên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Mã
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Đơn vị
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Loại giá trị
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Bắt buộc
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
                                {specs.map((spec) => (
                                    <tr key={spec.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-800">{spec.name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-800">{spec.code || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600">{spec.unit || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {ACCEPT_VALUE_TYPES[spec.acceptValueType]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {spec.isRequired ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Bắt buộc
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                    Không bắt buộc
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 text-sm">{spec.description || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditSpec(spec)}
                                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSpec(spec)}
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
                {!loadingSpecs && specs.length > 0 && (
                    <Pagination
                        pageNumber={pageNumber}
                        pageSize={pageSize}
                        totalItems={totalCount}
                        totalPages={totalPages}
                        loading={loadingSpecs}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            {/* Add/Edit Spec Modal */}
            {showSpecModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">
                            {editingSpec ? 'Chỉnh sửa Spec Definition' : 'Thêm Spec Definition mới'}
                        </h2>
                        <form onSubmit={handleSubmitSpec}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tên *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Nhập tên spec"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Mã *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Nhập mã spec"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Đơn vị
                                </label>
                                <input
                                    type="text"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Ví dụ: GB, inch, kg"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Loại giá trị *
                                </label>
                                <select
                                    value={formData.acceptValueType}
                                    onChange={(e) => setFormData({ ...formData, acceptValueType: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    {ACCEPT_VALUE_TYPE_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Mô tả <span className='text-red-500'>*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Nhập mô tả"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRequired}
                                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Bắt buộc</span>
                                </label>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowSpecModal(false)}
                                    disabled={submitting}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Đang xử lý...' : (editingSpec ? 'Cập nhật' : 'Thêm')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && specToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Xác nhận xóa</h2>
                            </div>
                        </div>
                        <p className="text-slate-600 mb-2">
                            Bạn có chắc chắn muốn xóa spec definition này?
                        </p>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
                            <p className="font-medium text-slate-800">{specToDelete.name}</p>
                            {specToDelete.description && (
                                <p className="text-sm text-slate-600 mt-1">{specToDelete.description}</p>
                            )}
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={cancelDeleteSpec}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteSpec}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                                Xóa spec
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoryDetailsPage;

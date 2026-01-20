import { useCallback, useEffect, useState } from 'react'
import { apiService } from '../config/axios'

export default function usePaginatedApi({ endpoint, initialPageSize = 10, initialPageNumber = 0, initialParams = {} }) {
  const [loading, setLoading] = useState(false)

  const [pageNumber, setPageNumber] = useState(initialPageNumber)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [data, setData] = useState([])
  const [params, setParams] = useState(initialParams)

  const fetchPage = useCallback(async (nextPageNumber = pageNumber, nextParams = params) => {
    setLoading(true)
    try {
      const res = await apiService.get(endpoint, {
        pageNumber: nextPageNumber,
        pageSize,
        ...nextParams
      })

      if (res?.succeeded) {
        setData(res?.data || [])
        setPageNumber(res?.pageNumber ?? nextPageNumber)
        setPageSize(res?.pageSize ?? pageSize)
        setTotalItems(res?.totalItems ?? 0)
        setTotalPages(res?.totalPages ?? 1)
        return true
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [endpoint, pageNumber, pageSize, params])

  useEffect(() => {
    fetchPage(0, params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])

  return {
    loading,
    data,
    pageNumber,
    pageSize,
    totalItems,
    totalPages,
    params,
    setParams,
    fetchPage,
    setPageNumber
  }
}

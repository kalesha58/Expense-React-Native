import { useEffect, useState } from 'react';
import { departmentAPI } from '../service/api';
import { logger } from '../utils/logger';

export interface Department {
  id: string;
  departmentCode: string;
  departmentName: string;
  flag?: string;
  syncStatus?: string;
}

interface ApiResponse {
  Response?: any[];
  data?: any[];
  Success?: boolean;
  success?: boolean;
  message?: string;
  error?: string;
}

export default function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        logger.info('Fetching departments from API');
        
        // Call the API directly
        const response = await departmentAPI.getAllDepartments();
        
        logger.info('API response for departments:', { response });
        
        // Handle different response formats
        let departmentsData: any[] = [];
        
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            departmentsData = response;
          } else if ((response as any).Response && Array.isArray((response as any).Response)) {
            departmentsData = (response as any).Response;
          } else if ((response as any).data && Array.isArray((response as any).data)) {
            departmentsData = (response as any).data;
          }
        }
        
        // Transform the data to match our interface
        const transformedDepartments: Department[] = departmentsData.map((item: any) => ({
          id: item.id || item.DepartmentID || item.department_id || item.DepartmentId,
          departmentCode: item.departmentCode || item.DepartmentCode || item.department_code,
          departmentName: item.departmentName || item.DepartmentName || item.department_name,
          flag: item.flag || item.Flag,
          syncStatus: item.syncStatus || item.SyncStatus || item.sync_status,
        }));
        
        if (transformedDepartments.length > 0) {
          setDepartments(transformedDepartments);
          logger.info('Departments loaded successfully from API', { count: transformedDepartments.length });
        } else {
          logger.warn('No departments found in API response, using fallback data');
          // Fallback to default departments if API returns empty
          const fallbackDepartments: Department[] = [
            { id: '1', departmentCode: '000', departmentName: 'No Department' },
            { id: '2', departmentCode: '100', departmentName: 'HR' },
            { id: '3', departmentCode: '200', departmentName: 'Finance' },
            { id: '4', departmentCode: '300', departmentName: 'Sales' },
            { id: '5', departmentCode: '400', departmentName: 'Purchase' },
            { id: '6', departmentCode: '500', departmentName: 'Production' },
            { id: '7', departmentCode: '600', departmentName: 'Stores' },
            { id: '8', departmentCode: '700', departmentName: 'Quality' },
            { id: '9', departmentCode: '800', departmentName: 'Maintenance' },
          ];
          setDepartments(fallbackDepartments);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error fetching departments from API', { error: errorMessage, fullError: error });
        setError(errorMessage);
        
        // Fallback to default departments on error
        const fallbackDepartments: Department[] = [
          { id: '1', departmentCode: '000', departmentName: 'No Department' },
          { id: '2', departmentCode: '100', departmentName: 'HR' },
          { id: '3', departmentCode: '200', departmentName: 'Finance' },
          { id: '4', departmentCode: '300', departmentName: 'Sales' },
          { id: '5', departmentCode: '400', departmentName: 'Purchase' },
          { id: '6', departmentCode: '500', departmentName: 'Production' },
          { id: '7', departmentCode: '600', departmentName: 'Stores' },
          { id: '8', departmentCode: '700', departmentName: 'Quality' },
          { id: '9', departmentCode: '800', departmentName: 'Maintenance' },
        ];
        setDepartments(fallbackDepartments);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return { departments, loading, error };
}

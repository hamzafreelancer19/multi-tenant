import { useEffect, useState } from "react";
import { getMyChild } from "../../api/studentsApi";
import { useTenant } from "../../context/TenantContext";

export default function useChildRecord() {
  const tenant = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyChild()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return {
    tenant,
    data,
    loading,
    student: data?.student || {},
    attendance: data?.attendance || {},
    fees: data?.fees || {},
    exams: data?.exams || [],
    results: data?.results || [],
    homework: data?.homework || [],
    timetable: data?.timetable || [],
    notices: data?.notices || [],
    library: data?.library || [],
    transport: data?.transport || null,
    incharge: data?.incharge || {},
  };
}

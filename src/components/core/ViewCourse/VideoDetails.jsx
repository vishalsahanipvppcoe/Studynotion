import React, { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation } from "react-router-dom"

import "video-react/dist/video-react.css"
import { BigPlayButton, Player } from "video-react"

import {
  markLectureAsComplete,
  fetchCourseDetails,
} from "../../../services/operations/courseDetailsAPI"

import { updateCompletedLectures } from "../../../slices/viewCourseSlice"
import IconBtn from "../../common/IconBtn"

const VideoDetails = () => {
  const { courseId, sectionId, subSectionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const playerRef = useRef(null)
  const dispatch = useDispatch()

  const { token } = useSelector((state) => state.auth)
  const { courseSectionData, courseEntireData, completedLectures } =
    useSelector((state) => state.viewCourse)

  const [videoData, setVideoData] = useState(null)
  const [previewSource, setPreviewSource] = useState("")
  const [videoEnded, setVideoEnded] = useState(false)
  const [loading, setLoading] = useState(false)

  // =====================================================
  // 1️⃣ Fetch Course Data If Page Refreshed
  // =====================================================
  useEffect(() => {
    const fetchData = async () => {
      if ((!courseSectionData || courseSectionData.length === 0) && courseId) {
        await fetchCourseDetails(courseId, token)
      }
    }
    fetchData()
  }, [courseId])

  // =====================================================
  // 2️⃣ Set Current Video Data
  // =====================================================
  useEffect(() => {
    if (!courseSectionData || courseSectionData.length === 0) return

    if (!courseId || !sectionId || !subSectionId) {
      navigate("/dashboard/enrolled-courses")
      return
    }

    const section = courseSectionData.find(
      (sec) => sec._id === sectionId
    )

    if (!section) return

    const video = section.subSection?.find(
      (sub) => sub._id === subSectionId
    )

    if (!video) return

    setVideoData(video)
    setPreviewSource(courseEntireData?.thumbnail || "")
    setVideoEnded(false)
  }, [courseSectionData, location.pathname])

  // =====================================================
  // 3️⃣ Safe Index Getter (NO CRASH EVER)
  // =====================================================
  const getIndexes = () => {
    if (!courseSectionData || courseSectionData.length === 0)
      return { sectionIndex: -1, subIndex: -1 }

    const sectionIndex = courseSectionData.findIndex(
      (sec) => sec._id === sectionId
    )

    if (sectionIndex === -1)
      return { sectionIndex: -1, subIndex: -1 }

    const subIndex =
      courseSectionData[sectionIndex]?.subSection?.findIndex(
        (sub) => sub._id === subSectionId
      )

    if (subIndex === -1)
      return { sectionIndex: -1, subIndex: -1 }

    return { sectionIndex, subIndex }
  }

  const isFirstVideo = () => {
    const { sectionIndex, subIndex } = getIndexes()
    if (sectionIndex === -1) return false
    return sectionIndex === 0 && subIndex === 0
  }

  const isLastVideo = () => {
    const { sectionIndex, subIndex } = getIndexes()
    if (sectionIndex === -1) return false

    const lastSection = courseSectionData.length - 1
    const lastSub =
      courseSectionData[sectionIndex].subSection.length - 1

    return sectionIndex === lastSection && subIndex === lastSub
  }

  const goToNextVideo = () => {
    const { sectionIndex, subIndex } = getIndexes()
    if (sectionIndex === -1) return

    const currentSection = courseSectionData[sectionIndex]
    const totalSubs = currentSection.subSection.length

    if (subIndex < totalSubs - 1) {
      const nextId =
        currentSection.subSection[subIndex + 1]._id

      navigate(
        `/view-course/${courseId}/section/${sectionId}/sub-section/${nextId}`
      )
    } else {
      if (sectionIndex + 1 >= courseSectionData.length) return

      const nextSection = courseSectionData[sectionIndex + 1]
      navigate(
        `/view-course/${courseId}/section/${nextSection._id}/sub-section/${nextSection.subSection[0]._id}`
      )
    }
  }

  const goToPrevVideo = () => {
    const { sectionIndex, subIndex } = getIndexes()
    if (sectionIndex === -1) return

    if (subIndex > 0) {
      const prevId =
        courseSectionData[sectionIndex].subSection[subIndex - 1]._id

      navigate(
        `/view-course/${courseId}/section/${sectionId}/sub-section/${prevId}`
      )
    } else {
      if (sectionIndex === 0) return

      const prevSection = courseSectionData[sectionIndex - 1]
      const prevId =
        prevSection.subSection[
          prevSection.subSection.length - 1
        ]._id

      navigate(
        `/view-course/${courseId}/section/${prevSection._id}/sub-section/${prevId}`
      )
    }
  }

  const handleLectureCompletion = async () => {
    setLoading(true)
    const res = await markLectureAsComplete(
      { courseId, subsectionId: subSectionId },
      token
    )

    if (res) {
      dispatch(updateCompletedLectures(subSectionId))
    }

    setLoading(false)
  }

  // =====================================================
  // 4️⃣ Loading Guard
  // =====================================================
  if (!courseSectionData || courseSectionData.length === 0) {
    return <div className="text-white">Loading...</div>
  }

  // =====================================================
  // 5️⃣ UI
  // =====================================================
  return (
    <div className="flex flex-col gap-5 text-white">
      {!videoData ? (
        <img
          src={previewSource}
          alt="Preview"
          className="h-full w-full rounded-md object-cover"
        />
      ) : (
        <Player
          ref={playerRef}
          aspectRatio="16:9"
          playsInline
          onEnded={() => setVideoEnded(true)}
          src={videoData?.videoUrl}
        >
          <BigPlayButton position="center" />

          {videoEnded && (
            <div className="absolute inset-0 z-[100] grid place-content-center bg-black/70">
              {!completedLectures?.includes(subSectionId) && (
                <IconBtn
                  disabled={loading}
                  onclick={handleLectureCompletion}
                  text={!loading ? "Mark As Completed" : "Loading..."}
                  customClasses="text-xl px-4 mx-auto"
                />
              )}

              <IconBtn
                disabled={loading}
                onclick={() => {
                  playerRef?.current?.seek(0)
                  setVideoEnded(false)
                }}
                text="Rewatch"
                customClasses="text-xl px-4 mx-auto mt-2"
              />

              <div className="mt-6 flex justify-center gap-x-4 text-xl">
                {!isFirstVideo() && (
                  <button
                    disabled={loading}
                    onClick={goToPrevVideo}
                    className="blackButton"
                  >
                    Prev
                  </button>
                )}

                {!isLastVideo() && (
                  <button
                    disabled={loading}
                    onClick={goToNextVideo}
                    className="blackButton"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </Player>
      )}

      <h1 className="mt-4 text-3xl font-semibold">
        {videoData?.title}
      </h1>

      <p className="pt-2 pb-6">
        {videoData?.description}
      </p>
    </div>
  )
}

export default VideoDetails
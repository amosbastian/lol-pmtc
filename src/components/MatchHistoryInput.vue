<template>
  <div class="container mx-auto">
    <div class="flex justify-center py-32">
      <div class="flex w-2/3">
        <input
          class="bg-grey-lighter w-full appearance-none border-2 border-grey-lighter rounded-l py-2 px-4 text-grey-darker leading-tight focus:outline-none focus:bg-white focus:border-purple-dark"
          type="text"
          placeholder="https://matchhistory.leagueoflegends.com/en/#match-details/..."
          v-model="matchHistoryURL"
        />
        <button
          class="py-2 px-4 bg-purple-dark text-white rounded-r hover:bg-purple focus:outline-none focus:border-purple"
          @click="submit"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      matchHistoryURL: ''
    };
  },
  methods: {
    submit() {
      this.$emit('urlSubmitted', this.matchHistoryURL);
    }
  }
};
</script>

<style scoped></style>
